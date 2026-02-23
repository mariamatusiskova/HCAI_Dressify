import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

const ConsentModal = ({ open, onAgree, onCancel }: ConsentModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="text-center items-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Before we start</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
            Dressify uses AI to generate clothing items based on your preferences.
            Your uploaded photo is stored <strong className="text-foreground">only in your browser's memory</strong> and
            is never sent to any server. Generated images are created via AI and
            may not reflect real products.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 sm:gap-3 mt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onAgree} className="flex-1">
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;
