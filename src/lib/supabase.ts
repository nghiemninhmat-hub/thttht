import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_EMAILS = [
  'kinhnha010@gmail.com',
  'hamthien53@gmail.com',
  'Ngoncanhtac001@gmail.com',
  'thanhhuyenbsc@gmail.com',
  'dungchikienn@gmail.com',
  'vinhtongthuong@gmail.com',
];

export const ADMIN_PASSWORD_DEFAULT = 'TrungHoanTai@2026!';

export const CURRENCY_LABELS: Record<string, string> = {
  HUA_TIEN: 'Hoa Tiền',
  CONG_DUC: 'Công Đức',
  AM_DUC: 'Âm Đức',
};

export const SHOP_AREA_LABELS: Record<string, string> = {
  'Thường': 'Thương Thành Thường',
  'Hiếm': 'Thương Thành Hiếm',
  'Sự kiện': 'Thương Thành Sự Kiện',
};

export const CURRENCY_ICONS: Record<string, string> = {
  HUA_TIEN: '🪙',
  CONG_DUC: '✨',
  AM_DUC: '🌑',
};

export interface Profile {
  id: string;
  email: string;
  oc_name: string;
  avatar_url: string | null;
  gender: string;
  bio: string | null;
  hua_tien: number;
  cong_duc: number;
  am_duc: number;
  is_approved: boolean;
  anonymous_name: string | null;
  anonymous_name_changes: number;
  created_at: string;
  wheel_spins: number;
  wheel_special_claimed: boolean;
  status_physical: string;
  status_spiritual: string;
  status_mental: string;
  danh_vong: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_user_id: string | null;
  target_description: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface WheelSpinResult {
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  currency_type: string | null;
  amount: number;
}

export interface WheelSpinLog {
  id: string;
  user_id: string;
  reward_key: string;
  reward_label: string;
  reward_group: string;
  is_special: boolean;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: string;
  price: number;
  currency_type: string;
  description: string | null;
  stock: number;
  price_secondary: number | null;
  currency_type_secondary: string | null;
  shop_area: string;
  purchase_limit: string | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  shop_items?: ShopItem;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  acquired_at: string;
  shop_items?: ShopItem;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  profiles?: { anonymous_name: string | null; oc_name: string } | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  profiles?: { anonymous_name: string | null; oc_name: string } | null;
  replies?: PostComment[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency_type: string;
  reason: string;
  created_at: string;
  related_user_name: string | null;
  profiles?: { oc_name: string; email: string } | null;
}

export interface SitePage {
  id: string;
  page_number: number;
  title: string;
  category: string;
  content: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
}

export interface SearchProfile {
  id: string;
  oc_name: string;
  anonymous_name: string | null;
  avatar_url: string | null;
  gender: string;
  bio: string | null;
  is_approved: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface KimBangEntry {
  id: string;
  rank: number;
  identity_name: string;
  wealth: string;
  quests_completed: number;
  honor_title: string;
  avatar_url: string;
  epithet: string;
  updated_at: string;
}

export interface WantedNotice {
  id: string;
  target_name: string;
  gender: string;
  age: string;
  occupation: string;
  organization: string;
  identifying_features: string;
  reason: string;
  task_requirement: string;
  completion_condition: string;
  avatar_url: string | null;
  reward_amount: string;
  reward_method: string;
  deadline: string;
  status: string;
  code: string | null;
  published_at: string | null;
  created_at: string;
  submitter_id: string | null;
}

export interface BachQuyAm {
  id: string;
  name: string;
  classification: string;
  danger_level: string;
  event_level: string | null;
  brief_description: string;
  weakness: string | null;
  appearance: string | null;
  behavior: string | null;
  destruction: string | null;
  sealing: string | null;
  display_order: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
}
