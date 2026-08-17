import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, ShopItem, SitePage, Transaction, InventoryItem, CURRENCY_LABELS, WantedNotice, KimBangEntry, AuditLog } from '@/lib/supabase';
import {
  Shield, Users, Coins, Store, BookOpen, Ghost, Check, X, Plus, Trash2,
  AlertCircle, CheckCircle2, History, Edit3, Eye, EyeOff, Dices, Package,
  Heart, Sparkle, Brain, Lock, Unlock, FileWarning, Crown, Save, ScrollText
} from 'lucide-react';

type Tab = 'accounts' | 'currency' | 'identities' | 'shop' | 'pages' | 'wheel' | 'inventories' | 'status' | 'settings' | 'wanted' | 'kimbang' | 'audit';

export default function AdminDashboard() {
  const { profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  // Data states
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [approvedProfiles, setApprovedProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Currency management
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currencyType, setCurrencyType] = useState('HUA_TIEN');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  // Shop management
  const [newItem, setNewItem] = useState({
    name: '', category: '', price: 0, currency_type: 'CONG_DUC',
    price_secondary: 0, currency_type_secondary: '',
    shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<ShopItem>>({});

  // Inventory management
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [allInventory, setAllInventory] = useState<(InventoryItem & { profiles?: { oc_name: string } | null })[]>([]);

  // Page management
  const [newPage, setNewPage] = useState({ page_number: 1, title: '', category: '', content: '' });

  // Identity reveal
  const [revealIds, setRevealIds] = useState<Set<string>>(new Set());

  // Wheel spins management
  const [spinUserId, setSpinUserId] = useState('');
  const [spinAmount, setSpinAmount] = useState(1);
  const [spinMsg, setSpinMsg] = useState('');

  // Registration lock
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [regMsg, setRegMsg] = useState('');

  // Wanted notices
  const [pendingNotices, setPendingNotices] = useState<WantedNotice[]>([]);
  const [activeNotices, setActiveNotices] = useState<WantedNotice[]>([]);

  // Kim Bang
  const [kimBangEntries, setKimBangEntries] = useState<KimBangEntry[]>([]);
  const [kimBangMsg, setKimBangMsg] = useState('');

  // Danh vọng editing
  const [editingDanhVongId, setEditingDanhVongId] = useState<string | null>(null);
  const [danhVongValue, setDanhVongValue] = useState('');

  // Transaction editing
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Partial<Transaction>>({});

  // Helper: log an admin action to the audit trail
  const logAction = async (action: string, targetUserId?: string, targetDesc?: string, details?: Record<string, unknown>) => {
    await supabase.rpc('log_admin_action', {
      p_action: action,
      p_target_user_id: targetUserId ?? null,
      p_target_description: targetDesc ?? null,
      p_details: details ?? null,
    });
  };

  const toggleRegistration = async () => {
    setRegMsg('');
    const newValue = !registrationOpen;
    const { error } = await supabase
      .from('site_settings')
      .update({ registration_open: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      setRegMsg(`Lỗi: ${error.message}`);
      return;
    }
    setRegistrationOpen(newValue);
    setRegMsg(newValue ? 'Đã mở cổng đăng ký.' : 'Đã khóa cổng đăng ký.');
    logAction('toggle_registration', undefined, newValue ? 'Mở cổng đăng ký' : 'Khóa cổng đăng ký');
  };

  const handleGrantSpins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinUserId || spinAmount < 1) return;
    setSpinMsg('');
    const { error } = await supabase.rpc('admin_grant_spins', {
      p_user_id: spinUserId,
      p_amount: spinAmount,
    });
    if (error) {
      setSpinMsg(`Lỗi: ${error.message}`);
      return;
    }
    const targetUser = allProfiles.find(p => p.id === spinUserId);
    setSpinMsg(`Đã cấp ${spinAmount} lượt quay thành công.`);
    logAction('grant_spins', spinUserId, `Cấp ${spinAmount} lượt quay cho ${targetUser?.oc_name || spinUserId.slice(0, 8)}`, { amount: spinAmount });
    setSpinUserId('');
    setSpinAmount(1);
    fetchAllData();
  };

  const handleStatusUpdate = async (userId: string, field: 'status_physical' | 'status_spiritual' | 'status_mental', value: string) => {
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', userId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    const fieldLabel = field === 'status_physical' ? 'Thể Chất' : field === 'status_spiritual' ? 'Tâm Linh' : 'Tinh Thần';
    logAction('update_status', userId, `Sửa ${fieldLabel} của ${targetUser?.oc_name || userId.slice(0, 8)} → "${value}"`, { field, value });
    fetchAllData();
  };

  const fetchAllData = useCallback(async () => {
    const [pending, approved, all, items, pages, txs, inv, settings, pendingWanted, activeWanted, kimBang, audit] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_items').select('*').order('price', { ascending: true }),
      supabase.from('site_pages').select('*').order('page_number', { ascending: true }),
      supabase.from('transactions').select('*, profiles(oc_name, email)').order('created_at', { ascending: false }).limit(100),
      supabase.from('inventories').select('*, shop_items(name, category), profiles(oc_name)').order('acquired_at', { ascending: false }),
      supabase.from('site_settings').select('registration_open').eq('id', 1).maybeSingle(),
      supabase.from('wanted_notices').select('id, submitter_id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('wanted_notices').select('id, submitter_id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at').eq('status', 'active').order('published_at', { ascending: false, nullsFirst: false }),
      supabase.from('kim_bang').select('id, rank, identity_name, wealth, quests_completed, honor_title, avatar_url, epithet, updated_at').order('rank', { ascending: true }),
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (kimBang?.data) setKimBangEntries(kimBang.data as KimBangEntry[]);
    if (pending.data) setPendingProfiles(pending.data as Profile[]);
    if (approved.data) setApprovedProfiles(approved.data as Profile[]);
    if (all.data) setAllProfiles(all.data as Profile[]);
    if (items.data) setShopItems(items.data as ShopItem[]);
    if (pages.data) setSitePages(pages.data as SitePage[]);
    if (txs.data) setTransactions(txs.data as Transaction[]);
    if (inv.data) setAllInventory(inv.data as (InventoryItem & { profiles?: { oc_name: string } | null })[]);
    if (settings?.data) setRegistrationOpen(settings.data.registration_open);
    if (pendingWanted?.data) setPendingNotices(pendingWanted.data as WantedNotice[]);
    if (activeWanted?.data) setActiveNotices(activeWanted.data as WantedNotice[]);
    if (audit?.data) setAuditLogs(audit.data as AuditLog[]);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const approveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({
      is_approved: true,
      approved_by: profile?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', userId);
    if (!error) {
      const targetUser = pendingProfiles.find(p => p.id === userId);
      logAction('approve_user', userId, `Phê duyệt ${targetUser?.oc_name || userId.slice(0, 8)}`);
      fetchAllData();
    }
  };

  const rejectUser = async (userId: string) => {
    if (!confirm('Từ chối và xóa tài khoản này?')) return;
    const targetUser = pendingProfiles.find(p => p.id === userId);
    await supabase.from('profiles').delete().eq('id', userId);
    logAction('reject_user', userId, `Từ chối và xóa ${targetUser?.oc_name || userId.slice(0, 8)}`);
    fetchAllData();
  };

  const handleCurrencyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !reason || amount === 0) return;

    const { data, error: rpcError } = await supabase.rpc('admin_adjust_currency', {
      p_user_id: selectedUserId,
      p_amount: amount,
      p_currency_type: currencyType,
      p_reason: reason,
    });

    if (rpcError) {
      alert(`Lỗi: ${rpcError.message}`);
      return;
    }

    if (data && data.success) {
      const targetUser = allProfiles.find(p => p.id === selectedUserId);
      logAction('adjust_currency', selectedUserId,
        `${amount > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(amount)} ${CURRENCY_LABELS[currencyType]} cho ${targetUser?.oc_name || selectedUserId.slice(0, 8)}`,
        { amount, currency_type: currencyType, reason });
      setAmount(0);
      setReason('');
      setSelectedUserId('');
      fetchAllData();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      currency_type: newItem.currency_type,
      shop_area: newItem.shop_area,
      description: newItem.description,
      stock: newItem.stock,
    };
    if (newItem.price_secondary > 0 && newItem.currency_type_secondary) {
      payload.price_secondary = newItem.price_secondary;
      payload.currency_type_secondary = newItem.currency_type_secondary;
    }
    if (newItem.purchase_limit) payload.purchase_limit = newItem.purchase_limit;
    const { error } = await supabase.from('shop_items').insert([payload]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('add_shop_item', undefined, `Thêm vật phẩm "${newItem.name}" (${newItem.shop_area})`, { name: newItem.name, price: newItem.price });
    setNewItem({
      name: '', category: '', price: 0, currency_type: 'CONG_DUC',
      price_secondary: 0, currency_type_secondary: '',
      shop_area: 'Thường', purchase_limit: '', description: '', stock: 99,
    });
    fetchAllData();
  };

  const handleEditItem = (item: ShopItem) => {
    setEditingItemId(item.id);
    setEditItem({ ...item });
  };

  const handleSaveEditItem = async (itemId: string) => {
    const { error } = await supabase.from('shop_items').update(editItem).eq('id', itemId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('edit_shop_item', undefined, `Sửa vật phẩm "${editItem.name}"`, { item_id: itemId, changes: editItem });
    setEditingItemId(null);
    setEditItem({});
    fetchAllData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Xóa vật phẩm này?')) return;
    const item = shopItems.find(i => i.id === itemId);
    const { error } = await supabase.from('shop_items').delete().eq('id', itemId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('delete_shop_item', undefined, `Xóa vật phẩm "${item?.name || itemId.slice(0, 8)}"`, { item_id: itemId });
    fetchAllData();
  };

  const handleRemoveInventoryItem = async (invId: string, itemName: string) => {
    if (!confirm(`Thu hồi "${itemName}" khỏi kho vật phẩm của người chơi?`)) return;
    const inv = allInventory.find(i => i.id === invId);
    const { error } = await supabase.from('inventories').delete().eq('id', invId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('revoke_inventory_item', inv?.user_id, `Thu hồi "${itemName}" khỏi kho ${inv?.profiles?.oc_name || ''}`.trim(), { inv_id: invId, item_name: itemName });
    fetchAllData();
  };

  const handleGrantInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get('inv_user_id') as string;
    const itemId = formData.get('inv_item_id') as string;
    if (!userId || !itemId) return;
    const { error } = await supabase.from('inventories').insert([{ user_id: userId, item_id: itemId }]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    const targetItem = shopItems.find(i => i.id === itemId);
    logAction('grant_inventory_item', userId, `Cấp "${targetItem?.name || itemId.slice(0, 8)}" cho ${targetUser?.oc_name || ''}`.trim(), { item_id: itemId });
    form.reset();
    fetchAllData();
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('site_pages').insert([newPage]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('add_page', undefined, `Thêm trang bách khoa "${newPage.title}"`, { page_number: newPage.page_number });
    setNewPage({ page_number: 1, title: '', category: '', content: '' });
    fetchAllData();
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Xóa trang này?')) return;
    const page = sitePages.find(p => p.id === pageId);
    const { error } = await supabase.from('site_pages').delete().eq('id', pageId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('delete_page', undefined, `Xóa trang "${page?.title || pageId.slice(0, 8)}"`, { page_id: pageId });
    fetchAllData();
  };

  const handleApproveWanted = async (id: string) => {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    const { error } = await supabase.from('wanted_notices').update({
      status: 'active',
      code,
      published_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = pendingNotices.find(n => n.id === id);
    logAction('approve_wanted', undefined, `Duyệt lệnh truy nã "${notice?.target_name || id.slice(0, 8)}" (${code})`, { notice_id: id, code });
    fetchAllData();
  };

  const handleRejectWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'rejected' }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = pendingNotices.find(n => n.id === id);
    logAction('reject_wanted', undefined, `Từ chối lệnh truy nã "${notice?.target_name || id.slice(0, 8)}"`, { notice_id: id });
    fetchAllData();
  };

  const handleCompleteWanted = async (id: string) => {
    const { error } = await supabase.from('wanted_notices').update({ status: 'completed' }).eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const notice = activeNotices.find(n => n.id === id);
    logAction('complete_wanted', undefined, `Đóng lệnh truy nã "${notice?.target_name || id.slice(0, 8)}"`, { notice_id: id });
    fetchAllData();
  };

  const handleDeleteWanted = async (id: string) => {
    if (!confirm('Xóa vĩnh viễn lệnh truy nã này?')) return;
    const { error } = await supabase.from('wanted_notices').delete().eq('id', id);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('delete_wanted', undefined, `Xóa lệnh truy nã ${id.slice(0, 8)}`, { notice_id: id });
    fetchAllData();
  };

  const handleUpdateKimBang = async (id: string, field: keyof KimBangEntry, value: string | number) => {
    setKimBangMsg('');
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    const { error } = await supabase.from('kim_bang').update({ [field]: cleanValue, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setKimBangMsg(`Lỗi: ${error.message}`); return; }
    logAction('update_kim_bang', undefined, `Cập nhật Kim Bảng hạng ${id} — ${field}`, { kim_bang_id: id, field, value: cleanValue });
    fetchAllData();
  };

  const handleSaveDanhVong = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ danh_vong: danhVongValue.trim() || 'Vô Danh' }).eq('id', userId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    logAction('set_danh_vong', userId, `Sửa danh vọng ${targetUser?.oc_name || userId.slice(0, 8)} → "${danhVongValue.trim() || 'Vô Danh'}"`, { danh_vong: danhVongValue.trim() || 'Vô Danh' });
    setEditingDanhVongId(null);
    setDanhVongValue('');
    fetchAllData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTx({ reason: tx.reason, amount: tx.amount, currency_type: tx.currency_type, related_user_name: tx.related_user_name });
  };

  const handleSaveEditTransaction = async (txId: string) => {
    const { error } = await supabase.from('transactions').update(editTx).eq('id', txId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const tx = transactions.find(t => t.id === txId);
    logAction('edit_transaction', tx?.user_id, `Sửa giao dịch ${txId.slice(0, 8)} (${tx?.profiles?.oc_name || ''})`.trim(), { tx_id: txId, changes: editTx });
    setEditingTxId(null);
    setEditTx({});
    fetchAllData();
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!confirm('Xóa giao dịch này? Hành động không thể hoàn tác.')) return;
    const tx = transactions.find(t => t.id === txId);
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    logAction('delete_transaction', tx?.user_id, `Xóa giao dịch ${txId.slice(0, 8)} (${tx?.profiles?.oc_name || ''})`.trim(), { tx_id: txId });
    fetchAllData();
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const userId = formData.get('tx_user_id') as string;
    const txAmount = parseInt(formData.get('tx_amount') as string, 10);
    const txType = formData.get('tx_currency_type') as string;
    const txReason = formData.get('tx_reason') as string;
    const txRelated = formData.get('tx_related') as string || null;
    if (!userId || !txReason || isNaN(txAmount)) return;
    const { error } = await supabase.from('transactions').insert([{
      user_id: userId,
      amount: txAmount,
      currency_type: txType,
      reason: txReason,
      related_user_name: txRelated,
    }]);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    const targetUser = allProfiles.find(p => p.id === userId);
    logAction('add_transaction', userId, `Thêm giao dịch ${txAmount > 0 ? '+' : ''}${txAmount} ${CURRENCY_LABELS[txType]} cho ${targetUser?.oc_name || ''}`.trim(), { amount: txAmount, currency_type: txType, reason: txReason });
    form.reset();
    fetchAllData();
  };

  const toggleReveal = (id: string) => {
    setRevealIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center">
        <div className="p-8 rounded-2xl bg-black/40 border border-red-500/20">
          <Shield className="w-12 h-12 text-red-400/60 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-amber-100/80">Không Có Quyền Truy Cập</h2>
          <p className="text-sm text-gray-500 mt-2">Tài khoản của bạn không có quyền quản trị.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'accounts', label: 'Phê Duyệt', icon: Users },
    { id: 'currency', label: 'Tài Sản', icon: Coins },
    { id: 'identities', label: 'Danh Tính', icon: Ghost },
    { id: 'shop', label: 'Thương Thành', icon: Store },
    { id: 'inventories', label: 'Kho Vật Phẩm', icon: Package },
    { id: 'pages', label: 'Bách Khoa', icon: BookOpen },
    { id: 'wheel', label: 'Vòng Quay', icon: Dices },
    { id: 'status', label: 'Trạng Thái', icon: Heart },
    { id: 'wanted', label: 'Truy Nã', icon: FileWarning },
    { id: 'kimbang', label: 'Kim Bảng', icon: Crown },
    { id: 'audit', label: 'Nhật Ký', icon: ScrollText },
    { id: 'settings', label: 'Cài Đặt', icon: Shield },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelCls = "block text-xs text-gray-400 mb-1.5 uppercase tracking-wider";
  const cardCls = "p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10";

  // Helper: find admin name by id
  const adminName = (id: string | null) => allProfiles.find(p => p.id === id)?.oc_name || (id ? id.slice(0, 8) : '—');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#670201] to-[#a00404] flex items-center justify-center shadow-lg shadow-[#670201]/30 flex-shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-amber-100/90 truncate">Bảng Điều Khiển Quản Trị</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Ban Quản Lý Trùng Hoan Tái · {profile?.oc_name}</p>
        </div>
      </div>

      {/* Tab Bar — horizontal scroll on mobile, wrap on desktop */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 pb-2 -mx-2 px-2 sm:flex-wrap sm:mx-0 sm:px-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#670201]/30 text-amber-100'
                  : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'accounts' && pendingProfiles.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{pendingProfiles.length}</span>
              )}
              {tab.id === 'wanted' && pendingNotices.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">{pendingNotices.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Chờ Phê Duyệt</h3>
            {pendingProfiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có tài khoản nào chờ phê duyệt.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingProfiles.map(p => (
                  <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{p.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.gender} · {p.anonymous_name}</p>
                        {p.bio && <p className="text-xs text-gray-500 mt-2 italic line-clamp-3">"{p.bio}"</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approveUser(p.id)} className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => rejectUser(p.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Tài Khoản Đã Phê Duyệt ({approvedProfiles.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{p.oc_name}</p>
                    {p.danh_vong && p.danh_vong !== 'Vô Danh' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold whitespace-nowrap">{p.danh_vong}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{p.email}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-amber-300">🪙 {p.hua_tien}</span>
                    <span className="text-cyan-300">✨ {p.cong_duc}</span>
                    <span className="text-amber-300">🌑 {p.am_duc}</span>
                  </div>
                  {p.approved_by && (
                    <p className="text-[10px] text-gray-600 mt-1">
                      Duyệt bởi: <span className="text-amber-300/70">{adminName(p.approved_by)}</span>
                      {p.approved_at && <span> · {new Date(p.approved_at).toLocaleDateString('vi-VN')}</span>}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {editingDanhVongId === p.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={danhVongValue}
                          onChange={e => setDanhVongValue(e.target.value)}
                          placeholder="vd: BAN QUẢN LÝ (để trống = Vô Danh)"
                          className="flex-1 min-w-0 px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                        />
                        <button onClick={() => handleSaveDanhVong(p.id)} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingDanhVongId(null); setDanhVongValue(''); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingDanhVongId(p.id); setDanhVongValue(p.danh_vong || 'Vô Danh'); }}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-300 transition-all"
                      >
                        <Edit3 className="w-3 h-3" /> Sửa danh vọng
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Tab */}
      {activeTab === 'currency' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Điều Chỉnh Tài Sản</h3>
            <form onSubmit={handleCurrencyChange} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Loại tiền tệ</label>
                  <select value={currencyType} onChange={e => setCurrencyType(e.target.value)} className={inputCls}>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Số lượng (+/-)</label>
                  <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do (bắt buộc)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} required placeholder="Lý do thay đổi..." className={inputCls} />
              </div>
              <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                Áp Dụng Thay Đổi
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Bổ Sung Giao Dịch Mới</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select name="tx_user_id" required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Số lượng (+/-)</label>
                  <input type="number" name="tx_amount" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Loại tiền</label>
                  <select name="tx_currency_type" className={inputCls}>
                    <option value="HUA_TIEN">Hoa Tiền</option>
                    <option value="CONG_DUC">Công Đức</option>
                    <option value="AM_DUC">Âm Đức</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Người liên quan</label>
                  <input type="text" name="tx_related" placeholder="Tên (nếu có)" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Lý do</label>
                <input type="text" name="tx_reason" required placeholder="Lý do giao dịch..." className={inputCls} />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Giao Dịch
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-amber-300/70" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Lịch Sử Giao Dịch Hệ Thống</h3>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                    {editingTxId === tx.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={editTx.amount ?? 0}
                            onChange={e => setEditTx({ ...editTx, amount: parseInt(e.target.value) || 0 })}
                            placeholder="Số lượng"
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          />
                          <select
                            value={editTx.currency_type ?? 'HUA_TIEN'}
                            onChange={e => setEditTx({ ...editTx, currency_type: e.target.value })}
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          >
                            <option value="HUA_TIEN">Hoa Tiền</option>
                            <option value="CONG_DUC">Công Đức</option>
                            <option value="AM_DUC">Âm Đức</option>
                          </select>
                          <input
                            type="text"
                            value={editTx.related_user_name ?? ''}
                            onChange={e => setEditTx({ ...editTx, related_user_name: e.target.value })}
                            placeholder="Người liên quan"
                            className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                          />
                        </div>
                        <input
                          type="text"
                          value={editTx.reason ?? ''}
                          onChange={e => setEditTx({ ...editTx, reason: e.target.value })}
                          placeholder="Lý do"
                          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEditTransaction(tx.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Save className="w-3.5 h-3.5" /> Lưu
                          </button>
                          <button onClick={() => { setEditingTxId(null); setEditTx({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-300 break-words">{tx.reason}</p>
                          <p className="text-xs text-gray-500">
                            <span className="text-amber-300/80 font-semibold">{tx.profiles?.oc_name || 'N/A'}</span>
                            <span className="text-gray-600 font-mono"> (ID: {tx.user_id.slice(0, 8)})</span>
                            {tx.related_user_name && (
                              <span className="text-amber-300/70"> · {tx.amount < 0 ? '→' : '←'} {tx.related_user_name}</span>
                            )}
                            <span className="text-gray-600 font-mono hidden sm:inline"> · Tx: {tx.id.slice(0, 8)}</span>
                            <span> · {new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                            <p className="text-xs text-gray-500">{CURRENCY_LABELS[tx.currency_type]}</p>
                          </div>
                          <button onClick={() => handleEditTransaction(tx)} className="p-1.5 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Identities Tab */}
      {activeTab === 'identities' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Ghost className="w-4 h-4 inline mr-1" />
              Quản trị viên có thể xem danh tính thật của các tài khoản ẩn danh. Nhấn vào biểu tượng mắt để hiện/ẩn.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProfiles.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-amber-100/90 truncate">{p.oc_name}</p>
                    {p.danh_vong && p.danh_vong !== 'Vô Danh' && <span className="text-[10px] text-amber-300 font-bold">{p.danh_vong}</span>}
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">Ẩn danh: {p.anonymous_name}</p>
                  </div>
                  <button onClick={() => toggleReveal(p.id)} className="p-2 text-gray-500 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-all flex-shrink-0">
                    {revealIds.has(p.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {revealIds.has(p.id) && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400">Email thật: <span className="text-amber-200">{p.email}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Giới tính: {p.gender}</p>
                    <p className="text-xs text-gray-400 mt-1">Đã đổi danh tính: {p.anonymous_name_changes}/3 lần</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Vật Phẩm Mới</h3>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Tên vật phẩm" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required className={inputCls} />
              <input type="text" placeholder="Danh mục" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} required className={inputCls} />
              <select value={newItem.shop_area} onChange={e => setNewItem({ ...newItem, shop_area: e.target.value })} className={inputCls}>
                <option value="Thường">Thương Thành Thường</option>
                <option value="Hiếm">Thương Thành Hiếm</option>
                <option value="Sự kiện">Thương Thành Sự Kiện</option>
              </select>
              <input type="text" placeholder="Giới hạn mua (vd: 2 lá/tuần)" value={newItem.purchase_limit} onChange={e => setNewItem({ ...newItem, purchase_limit: e.target.value })} className={inputCls} />
              <input type="number" placeholder="Giá chính" value={newItem.price || ''} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })} required className={inputCls} />
              <select value={newItem.currency_type} onChange={e => setNewItem({ ...newItem, currency_type: e.target.value })} className={inputCls}>
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Giá phụ (0 = không có)" value={newItem.price_secondary || ''} onChange={e => setNewItem({ ...newItem, price_secondary: parseInt(e.target.value) || 0 })} className={inputCls} />
              <select value={newItem.currency_type_secondary} onChange={e => setNewItem({ ...newItem, currency_type_secondary: e.target.value })} className={inputCls}>
                <option value="">Không giá phụ</option>
                <option value="HUA_TIEN">Hoa Tiền</option>
                <option value="CONG_DUC">Công Đức</option>
                <option value="AM_DUC">Âm Đức</option>
              </select>
              <input type="number" placeholder="Tồn kho" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })} className={inputCls} />
              <input type="text" placeholder="Mô tả" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} />
              <button type="submit" className="md:col-span-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Vật Phẩm
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Vật Phẩm ({shopItems.length})</h3>
            <div className="space-y-2">
              {shopItems.map(item => (
                <div key={item.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" value={editItem.name ?? ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} placeholder="Tên" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.category ?? ''} onChange={e => setEditItem({ ...editItem, category: e.target.value })} placeholder="Danh mục" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="number" value={editItem.price ?? 0} onChange={e => setEditItem({ ...editItem, price: parseInt(e.target.value) || 0 })} placeholder="Giá" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <select value={editItem.currency_type ?? 'HUA_TIEN'} onChange={e => setEditItem({ ...editItem, currency_type: e.target.value })} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40">
                          <option value="HUA_TIEN">Hoa Tiền</option>
                          <option value="CONG_DUC">Công Đức</option>
                          <option value="AM_DUC">Âm Đức</option>
                        </select>
                        <select value={editItem.shop_area ?? 'Thường'} onChange={e => setEditItem({ ...editItem, shop_area: e.target.value })} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40">
                          <option value="Thường">Thương Thành Thường</option>
                          <option value="Hiếm">Thương Thành Hiếm</option>
                          <option value="Sự kiện">Thương Thành Sự Kiện</option>
                        </select>
                        <input type="number" value={editItem.stock ?? 0} onChange={e => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })} placeholder="Tồn kho" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.purchase_limit ?? ''} onChange={e => setEditItem({ ...editItem, purchase_limit: e.target.value })} placeholder="Giới hạn mua" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                        <input type="text" value={editItem.description ?? ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} placeholder="Mô tả" className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-amber-500/40" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEditItem(item.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button onClick={() => { setEditingItemId(null); setEditItem({}); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold">
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">{item.name} <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 ml-1">{item.shop_area}</span></p>
                        <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID: {item.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate">{item.category} · {item.price} {CURRENCY_LABELS[item.currency_type]}{item.price_secondary && item.currency_type_secondary ? ` / ${item.price_secondary} ${CURRENCY_LABELS[item.currency_type_secondary]}` : ''} · Kho: {item.stock}</p>
                        {item.purchase_limit && <p className="text-[10px] text-gray-600 truncate">Giới hạn: {item.purchase_limit}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventories Tab */}
      {activeTab === 'inventories' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Bổ Sung Vật Phẩm Vào Kho Người Chơi</h3>
            <form onSubmit={handleGrantInventoryItem} className="flex flex-col sm:flex-row gap-3">
              <select name="inv_user_id" required className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="">Chọn người chơi...</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email}</option>
                ))}
              </select>
              <select name="inv_item_id" required className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="">Chọn vật phẩm...</option>
                {shopItems.map(it => (
                  <option key={it.id} value={it.id}>{it.name} · ID: {it.id.slice(0, 8)} · {it.category}</option>
                ))}
              </select>
              <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Bổ Sung
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80">Kho Vật Phẩm Toàn Hệ Thống ({allInventory.length})</h3>
              <select value={inventoryFilter} onChange={e => setInventoryFilter(e.target.value)} className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all">
                <option value="all">Tất cả người chơi</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            {allInventory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có vật phẩm nào trong kho.</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 sm:pr-2">
                {allInventory
                  .filter(inv => inventoryFilter === 'all' || inv.user_id === inventoryFilter)
                  .map(inv => (
                    <div key={inv.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">{inv.shop_items?.name || 'Vật phẩm đã xóa'}</p>
                        <p className="text-[10px] text-gray-600 font-mono hidden sm:block">Inv: {inv.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="text-amber-300/80 font-semibold">{inv.profiles?.oc_name || 'N/A'}</span>
                          <span className="text-gray-600 font-mono"> (ID: {inv.user_id.slice(0, 8)})</span>
                          <span> · {inv.shop_items?.category || '—'} · {new Date(inv.acquired_at).toLocaleDateString('vi-VN')}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveInventoryItem(inv.id, inv.shop_items?.name || 'vật phẩm này')}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                        title="Thu hồi vật phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wheel Tab */}
      {activeTab === 'wheel' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Cấp Lượt Quay Bách Pháp Mệnh</h3>
            <form onSubmit={handleGrantSpins} className="space-y-4">
              <div>
                <label className={labelCls}>Người chơi</label>
                <select value={spinUserId} onChange={e => setSpinUserId(e.target.value)} required className={inputCls}>
                  <option value="">Chọn người chơi...</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.oc_name} · ID: {p.id.slice(0, 8)} · {p.email} — Đang có {p.wheel_spins ?? 0} lượt</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Số lượt cấp (1-1000)</label>
                <input type="number" min={1} max={1000} value={spinAmount} onChange={e => setSpinAmount(parseInt(e.target.value) || 1)} required className={inputCls} />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Dices className="w-4 h-4" /> Cấp Lượt Quay
              </button>
              {spinMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${spinMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                  {spinMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {spinMsg}
                </div>
              )}
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lượt Quay Của Người Chơi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{p.oc_name}</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Dices className="h-3.5 w-3.5 text-amber-300/70" />
                    <span className="text-gray-400">Lượt quay:</span>
                    <span className="font-bold text-amber-200">{p.wheel_spins ?? 0}</span>
                  </div>
                  {p.wheel_special_claimed && (
                    <p className="mt-1 text-[10px] text-rose-300/70">Đã nhận Quà Đặc Biệt</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Heart className="w-4 h-4 inline mr-1" />
              Quản trị viên thay đổi trạng thái Thể Chất, Tâm Linh, Tinh Thần của từng người chơi. Trạng thái khởi đầu của tất cả là "Bình Thường".
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedProfiles.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.oc_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#670201]/30 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-amber-300/60" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-amber-100/90 text-sm truncate">{p.oc_name}</p>
                    <p className="text-[10px] text-gray-600 font-mono">ID: {p.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {([
                    { field: 'status_physical' as const, label: 'Thể Chất', icon: Heart, color: 'text-red-400' },
                    { field: 'status_spiritual' as const, label: 'Tâm Linh', icon: Sparkle, color: 'text-amber-400' },
                    { field: 'status_mental' as const, label: 'Tinh Thần', icon: Brain, color: 'text-purple-400' },
                  ]).map(({ field, label, icon: Icon, color }) => (
                    <div key={field} className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 w-14 sm:w-16 flex-shrink-0">{label}</span>
                      <input
                        type="text"
                        defaultValue={p[field]}
                        key={`${p.id}-${field}-${p[field]}`}
                        onBlur={e => { if (e.target.value !== p[field]) handleStatusUpdate(p.id, field, e.target.value); }}
                        placeholder="Bình Thường"
                        className="flex-1 min-w-0 px-2.5 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Thêm Trang Bách Khoa</h3>
            <form onSubmit={handleAddPage} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Số trang" value={newPage.page_number || ''} onChange={e => setNewPage({ ...newPage, page_number: parseInt(e.target.value) || 1 })} required className={inputCls} />
                <input type="text" placeholder="Thể loại" value={newPage.category} onChange={e => setNewPage({ ...newPage, category: e.target.value })} required className="col-span-2 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all" />
              </div>
              <input type="text" placeholder="Tiêu đề" value={newPage.title} onChange={e => setNewPage({ ...newPage, title: e.target.value })} required className={inputCls} />
              <textarea placeholder="Nội dung..." value={newPage.content} onChange={e => setNewPage({ ...newPage, content: e.target.value })} required rows={5} className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none" />
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Thêm Trang
              </button>
            </form>
          </div>

          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Danh Sách Trang ({sitePages.length})</h3>
            <div className="space-y-2">
              {sitePages.map(page => (
                <div key={page.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">Trang {page.page_number}: {page.title}</p>
                    <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID: {page.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 truncate">{page.category}</p>
                  </div>
                  <button onClick={() => handleDeletePage(page.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wanted Tab */}
      {activeTab === 'wanted' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lệnh Truy Nã Chờ Duyệt ({pendingNotices.length})</h3>
            {pendingNotices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có lệnh truy nã nào chờ duyệt.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingNotices.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-[#670201]/30 bg-[#670201]/20">
                        {n.avatar_url ? (
                          <img src={n.avatar_url} alt={n.target_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><FileWarning className="h-5 w-5 text-amber-300/50" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-amber-100/90 text-sm truncate">{n.target_name}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID lệnh: {n.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.occupation || '—'} · {n.gender || '—'}{n.age ? ` · ${n.age}` : ''}</p>
                        <p className="text-xs mt-1">
                          <span className="text-gray-500">Người gửi: </span>
                          <span className="text-amber-300/80 font-semibold">{allProfiles.find(p => p.id === n.submitter_id)?.oc_name || 'Ẩn danh'}</span>
                          {n.submitter_id && <span className="text-gray-600 font-mono"> (ID: {n.submitter_id.slice(0, 8)})</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.reason}</p>
                        {n.reward_amount && <p className="text-xs text-amber-200/70 mt-1">Thưởng: {n.reward_amount}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApproveWanted(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => handleRejectWanted(n.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all">
                        <X className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Lệnh Truy Nã Đang Hiển Thị ({activeNotices.length})</h3>
            {activeNotices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Chưa có lệnh truy nã nào đang hiển thị.</p>
            ) : (
              <div className="space-y-2">
                {activeNotices.map(n => (
                  <div key={n.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-black/20 border border-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-100/90 truncate">
                        {n.target_name} <span className="font-mono text-xs text-amber-300/70 ml-1">{n.code}</span>
                      </p>
                      <p className="text-[10px] text-gray-600 font-mono hidden sm:block">ID lệnh: {n.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        Gửi bởi: <span className="text-amber-300/80 font-semibold">{allProfiles.find(p => p.id === n.submitter_id)?.oc_name || 'Ẩn danh'}</span>
                        {n.submitter_id && <span className="text-gray-600 font-mono"> (ID: {n.submitter_id.slice(0, 8)})</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.reason}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleCompleteWanted(n.id)} className="px-2.5 py-1 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-xs font-bold transition-all">
                        Đóng
                      </button>
                      <button onClick={() => handleDeleteWanted(n.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kim Bang Tab */}
      {activeTab === 'kimbang' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <Crown className="w-4 h-4 inline mr-1" />
              Cập nhật 6 vị trí Kim Bảng Đề Danh. Thay đổi sẽ hiển thị ngay trên trang Kim Bảng công khai.
            </p>
          </div>
          {kimBangMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${kimBangMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
              {kimBangMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {kimBangMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kimBangEntries.map(entry => (
              <div key={entry.id} className="p-4 rounded-xl bg-black/30 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-ink-950 font-bold text-sm flex-shrink-0">
                    {entry.rank}
                  </div>
                  <h4 className="font-serif font-bold text-amber-100/90 text-sm sm:text-base">
                    {['', 'Đệ Nhất', 'Đệ Nhị', 'Đệ Tam', 'Đệ Tứ', 'Đệ Ngũ', 'Đệ Lục'][entry.rank]}
                  </h4>
                </div>

                {/* Avatar preview */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-amber-500/20 bg-black/30 flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url.trim()}
                        alt={entry.identity_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) parent.classList.add('flex', 'items-center', 'justify-center');
                          if (parent && !parent.querySelector('span')) {
                            const span = document.createElement('span');
                            span.textContent = 'Lỗi';
                            span.className = 'text-red-500 text-xs';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-600 text-xs">Chưa có</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      type="text"
                      defaultValue={entry.avatar_url}
                      placeholder="Dán link ảnh đại diện..."
                      onBlur={e => { if (e.target.value !== entry.avatar_url) handleUpdateKimBang(entry.id, 'avatar_url', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                    {entry.avatar_url && (
                      <button
                        onClick={() => handleUpdateKimBang(entry.id, 'avatar_url', '')}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh tính</label>
                    <input
                      type="text"
                      defaultValue={entry.identity_name}
                      placeholder="Tên nhân vật..."
                      onBlur={e => { if (e.target.value !== entry.identity_name) handleUpdateKimBang(entry.id, 'identity_name', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tài phú</label>
                      <input
                        type="text"
                        defaultValue={entry.wealth}
                        placeholder="vd: 8.460 Hoa Tiền"
                        onBlur={e => { if (e.target.value !== entry.wealth) handleUpdateKimBang(entry.id, 'wealth', e.target.value); }}
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Dị sự</label>
                      <input
                        type="number"
                        defaultValue={entry.quests_completed}
                        onBlur={e => { const v = parseInt(e.target.value) || 0; if (v !== entry.quests_completed) handleUpdateKimBang(entry.id, 'quests_completed', v); }}
                        className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/40 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Danh hiệu tri ân</label>
                    <input
                      type="text"
                      defaultValue={entry.honor_title}
                      placeholder="vd: Trảm U Minh"
                      onBlur={e => { if (e.target.value !== entry.honor_title) handleUpdateKimBang(entry.id, 'honor_title', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vĩ ngữ</label>
                    <input
                      type="text"
                      defaultValue={entry.epithet}
                      placeholder="vd: Một kiếm trấn tà, danh vang đất Trùng Hoan."
                      onBlur={e => { if (e.target.value !== entry.epithet) handleUpdateKimBang(entry.id, 'epithet', e.target.value); }}
                      className="w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-300/80">
              <ScrollText className="w-4 h-4 inline mr-1" />
              Nhật ký ghi lại mọi thao tác của Ban Quản Lý — phê duyệt, cộng/trừ tài sản, sửa vật phẩm, xóa giao dịch, cấp lượt quay, v.v. — để kiểm soát và minh bạch.
            </p>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có ghi chép nào.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 break-words">
                        <span className="text-amber-300/80 font-semibold">{log.admin_email || adminName(log.admin_id)}</span>
                        <span className="text-gray-500"> · </span>
                        <span className="text-gray-400">{log.action}</span>
                      </p>
                      {log.target_description && (
                        <p className="text-xs text-gray-400 mt-1 break-words">{log.target_description}</p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                        {log.target_user_id && <span className="font-mono"> · Mục tiêu: {log.target_user_id.slice(0, 8)}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/80 mb-4">Cổng Đăng Ký</h3>
            <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-black/20 border border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                {registrationOpen ? (
                  <Unlock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90">
                    {registrationOpen ? 'Cổng đăng ký đang mở' : 'Cổng đăng ký đang khóa'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {registrationOpen
                      ? 'Người chơi mới có thể gửi hồ sơ đăng ký.'
                      : 'Trang đăng ký hiển thị thông báo khóa, không cho phép gửi hồ sơ.'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleRegistration}
                className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                  registrationOpen
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {registrationOpen ? 'Khóa' : 'Mở'}
              </button>
            </div>
            {regMsg && (
              <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${regMsg.startsWith('Lỗi') ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'}`}>
                {regMsg.startsWith('Lỗi') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {regMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
