import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userId: string
  userEmail?: string
}

interface DeleteBatchRequest {
  userIds: string[]
  userEmails?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Validate caller using JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(jwt)
    
    if (userError || !user) {
      console.error('Auth validation error:', userError)
      throw new Error('Invalid or expired token')
    }

    // Only admins can delete users
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !callerProfile) {
      throw new Error('Could not verify user permissions')
    }

    if (callerProfile.role !== 'admin') {
      throw new Error('Access denied: Only admins can delete users')
    }

    const requestBody = await req.json()
    const isBatch = Array.isArray(requestBody.userIds || requestBody.userEmails)

    if (isBatch) {
      return await handleBatchDelete(supabaseAdmin, requestBody as DeleteBatchRequest, user.id)
    } else {
      return await handleSingleDelete(supabaseAdmin, requestBody as DeleteUserRequest, user.id)
    }

  } catch (error) {
    console.error('Error in delete-user-cascade function:', error)
    let status = 400
    const message = (error as Error).message || 'Unknown error'
    if (message.includes('Access denied') || message.includes('Invalid or expired token')) {
      status = 403
    }
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})

async function handleSingleDelete(supabaseAdmin: any, request: DeleteUserRequest, callerId: string) {
  const { userId, userEmail } = request
  
  let targetUserId = userId
  
  // If email provided, find user by email
  if (userEmail && !userId) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (error || !profile) {
      throw new Error(`User not found with email: ${userEmail}`)
    }
    targetUserId = profile.id
  }

  if (!targetUserId) {
    throw new Error('Missing userId or userEmail')
  }

  if (targetUserId === callerId) {
    throw new Error('You cannot delete your own account')
  }

  await deleteUserWithCascade(supabaseAdmin, targetUserId)

  return new Response(
    JSON.stringify({ 
      message: 'User deleted successfully',
      deletedUserId: targetUserId 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}

async function handleBatchDelete(supabaseAdmin: any, request: DeleteBatchRequest, callerId: string) {
  const { userIds = [], userEmails = [] } = request
  const results: Array<{ id: string, email?: string, success: boolean, error?: string }> = []
  
  // Convert emails to IDs
  const allUserIds = [...userIds]
  
  if (userEmails.length > 0) {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('email', userEmails)
    
    if (error) {
      throw new Error('Failed to lookup users by email')
    }
    
    profiles?.forEach(profile => {
      allUserIds.push(profile.id)
    })
  }

  // Remove caller's ID if present
  const filteredUserIds = allUserIds.filter(id => id !== callerId)

  // Delete users one by one
  for (const userId of filteredUserIds) {
    try {
      await deleteUserWithCascade(supabaseAdmin, userId)
      results.push({ id: userId, success: true })
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error)
      results.push({ 
        id: userId, 
        success: false, 
        error: (error as Error).message 
      })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return new Response(
    JSON.stringify({ 
      message: `Batch deletion completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: { successful: successCount, failed: failureCount }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}

async function deleteUserWithCascade(supabaseAdmin: any, userId: string) {
  console.log(`Starting cascade deletion for user: ${userId}`)

  // 1. Delete attendance records
  const { error: attendanceError } = await supabaseAdmin
    .from('attendance')
    .delete()
    .eq('student_id', userId)
  
  if (attendanceError) {
    console.warn('Error deleting attendance:', attendanceError.message)
  }

  // 2. Delete grades
  const { error: gradesError } = await supabaseAdmin
    .from('grades')
    .delete()
    .eq('student_id', userId)
  
  if (gradesError) {
    console.warn('Error deleting grades:', gradesError.message)
  }

  // Also delete grades where user is the teacher
  const { error: teacherGradesError } = await supabaseAdmin
    .from('grades')
    .delete()
    .eq('teacher_id', userId)
  
  if (teacherGradesError) {
    console.warn('Error deleting teacher grades:', teacherGradesError.message)
  }

  // 3. Delete evasions
  const { error: evasionsError } = await supabaseAdmin
    .from('evasions')
    .delete()
    .eq('student_id', userId)
  
  if (evasionsError) {
    console.warn('Error deleting evasions:', evasionsError.message)
  }

  // Also delete evasions reported by this user
  const { error: reportedEvasionsError } = await supabaseAdmin
    .from('evasions')
    .delete()
    .eq('reported_by', userId)
  
  if (reportedEvasionsError) {
    console.warn('Error deleting reported evasions:', reportedEvasionsError.message)
  }

  // 4. Delete declarations
  const { error: declarationsError } = await supabaseAdmin
    .from('declarations')
    .delete()
    .eq('student_id', userId)
  
  if (declarationsError) {
    console.warn('Error deleting declarations:', declarationsError.message)
  }

  // Also delete declarations processed by this user
  const { error: processedDeclarationsError } = await supabaseAdmin
    .from('declarations')
    .delete()
    .eq('processed_by', userId)
  
  if (processedDeclarationsError) {
    console.warn('Error deleting processed declarations:', processedDeclarationsError.message)
  }

  // 5. Update subjects (set teacher_id to NULL instead of deleting)
  const { error: subjectsError } = await supabaseAdmin
    .from('subjects')
    .update({ teacher_id: null })
    .eq('teacher_id', userId)
  
  if (subjectsError) {
    console.warn('Error updating subjects:', subjectsError.message)
  }

  // 6. Update classes (set teacher_id to NULL instead of deleting)
  const { error: classesError } = await supabaseAdmin
    .from('classes')
    .update({ teacher_id: null })
    .eq('teacher_id', userId)
  
  if (classesError) {
    console.warn('Error updating classes:', classesError.message)
  }

  // 7. Update communications (set author_id to NULL instead of deleting)
  const { error: communicationsError } = await supabaseAdmin
    .from('communications')
    .update({ author_id: null })
    .eq('author_id', userId)
  
  if (communicationsError) {
    console.warn('Error updating communications:', communicationsError.message)
  }

  // 8. Update equipment (set responsible_id to NULL)
  const { error: equipmentError } = await supabaseAdmin
    .from('equipment')
    .update({ responsible_id: null })
    .eq('responsible_id', userId)
  
  if (equipmentError) {
    console.warn('Error updating equipment:', equipmentError.message)
  }

  // 9. Delete student academic info
  const { error: academicError } = await supabaseAdmin
    .from('student_academic_info')
    .delete()
    .eq('student_id', userId)
  
  if (academicError) {
    console.warn('Error deleting academic info:', academicError.message)
  }

  // 10. Delete from auth (this will also trigger profile deletion via trigger)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    throw new Error(`Failed to delete user from auth: ${authError.message}`)
  }

  // 11. Clean up profile row (if any remains)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    console.warn('Profile cleanup error:', profileError.message)
  }

  console.log(`Successfully deleted user: ${userId}`)
}