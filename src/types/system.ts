/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemNotification {
  id: string;
  type: string;
  data: any;
  created_at: string;
  read_at: string | null;
}
