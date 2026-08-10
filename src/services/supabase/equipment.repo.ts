import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type { EquipmentCatalogRow, UserEquipmentRow } from '@/types/database';

export async function awardChallengeGems(challengeId: string): Promise<number> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('award_challenge_gems', {
      p_challenge_id: challengeId,
    });
    if (error) throw error;
    return typeof data === 'number' ? data : 0;
  } catch (error) {
    throw toRepositoryError(error, 'Chưa nhận được Gem của nhiệm vụ.');
  }
}

export async function fetchEquipmentCatalog(): Promise<EquipmentCatalogRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('equipment_catalog')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as EquipmentCatalogRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh mục trang bị.');
  }
}

export async function fetchUserEquipment(userId: string): Promise<UserEquipmentRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('user_equipment')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as UserEquipmentRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được kho trang bị của em.');
  }
}

export async function purchaseOrUpgradeEquipment(equipmentId: string): Promise<UserEquipmentRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('purchase_or_upgrade_equipment', {
      p_equipment_id: equipmentId,
    });
    if (error) throw error;
    return data as UserEquipmentRow;
  } catch (error) {
    throw toRepositoryError(error, 'Chưa mua hoặc nâng cấp được trang bị.');
  }
}

export async function equipItem(equipmentId: string): Promise<UserEquipmentRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('equip_item', {
      p_equipment_id: equipmentId,
    });
    if (error) throw error;
    return data as UserEquipmentRow;
  } catch (error) {
    throw toRepositoryError(error, 'Chưa trang bị được vật phẩm này.');
  }
}
