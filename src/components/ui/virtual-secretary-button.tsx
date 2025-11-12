import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { VirtualSecretaryDialog } from './virtual-secretary-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const VirtualSecretaryButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 animate-pulse"
              onClick={() => setDialogOpen(true)}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-card text-card-foreground border-border">
            <p className="font-medium">🤖 Secretária Virtual</p>
            <p className="text-xs text-muted-foreground">Análise com Inteligência Artificial</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <VirtualSecretaryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};