import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../../core/models/user.model';

/**
 * Transforms a UserRole into a CSS class suffix for the `.tag` component.
 *
 * Usage in template:
 *   <span class="tag" [class]="'tag ' + (user.role | roleBadge)">{{ user.role }}</span>
 */
@Pipe({
  name: 'roleBadge',
  standalone: false,
  pure: true
})
export class RoleBadgePipe implements PipeTransform {
  transform(role: UserRole | string | null | undefined): string {
    switch (role) {
      case 'Admin':       return 'admin';
      case 'General User': return 'general';
      case 'Super Admin':  return 'super-admin';
      default:            return '';
    }
  }
}
