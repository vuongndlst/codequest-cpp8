-- Cover foreign keys that appear in deletes/joins on teacher dashboards.
create index if not exists idx_class_area_controls_updated_by
  on public.class_area_controls(updated_by);
create index if not exists idx_class_settings_updated_by
  on public.class_settings(updated_by);
create index if not exists idx_classes_created_by
  on public.classes(created_by);
create index if not exists idx_messages_sender_id
  on public.messages(sender_id);
create index if not exists idx_user_badges_badge_id
  on public.user_badges(badge_id);
create index if not exists idx_user_equipment_equipment_id
  on public.user_equipment(equipment_id);

-- Evaluate auth.uid() once per statement instead of once per candidate row.
drop policy if exists class_teachers_delete on public.class_teachers;
create policy class_teachers_delete on public.class_teachers
  for delete to authenticated
  using (public.teaches_class(class_id) and teacher_id <> (select auth.uid()));

drop policy if exists gem_rewards_select_own on public.challenge_gem_rewards;
create policy gem_rewards_select_own on public.challenge_gem_rewards
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_equipment_select_own on public.user_equipment;
create policy user_equipment_select_own on public.user_equipment
  for select to authenticated
  using (user_id = (select auth.uid()));
