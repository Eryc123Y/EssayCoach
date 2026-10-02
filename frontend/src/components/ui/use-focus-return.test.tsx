import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from './alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

// Neither dialog uses a <DialogTrigger>, which is how most screens open them.
function PlainButtonDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open dialog</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MenuOpenedDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label='row actions'>actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpen(true)}>delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Sure?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

describe('dialog focus return', () => {
  it('returns focus to the button that opened a dialog', async () => {
    const user = userEvent.setup();
    render(<PlainButtonDialog />);
    const opener = screen.getByRole('button', { name: 'open dialog' });

    await user.click(opener);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('returns focus to the menu trigger when an alert dialog was opened from a menu item', async () => {
    const user = userEvent.setup();
    render(<MenuOpenedDialog />);
    const trigger = screen.getByRole('button', { name: 'row actions' });

    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'delete' }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
