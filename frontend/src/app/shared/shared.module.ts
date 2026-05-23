import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ToastComponent } from './components/toast/toast.component';
import { RoleBadgePipe } from './pipes/role-badge.pipe';

const SHARED = [
  ConfirmDialogComponent,
  SpinnerComponent,
  ToastComponent,
  RoleBadgePipe
];

@NgModule({
  declarations: SHARED,
  imports: [CommonModule],
  exports: SHARED
})
export class SharedModule {}
