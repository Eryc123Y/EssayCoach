export function normalizeUserInfo(raw: any): any {
  if (!raw) return raw;

  const roleRaw = (raw.user_role ?? raw.role ?? 'student') as string;
  const normalizedRole =
    roleRaw === 'teacher'
      ? 'lecturer'
      : ['student', 'lecturer', 'admin'].includes(roleRaw)
        ? roleRaw
        : 'student';

  const normalizedUserId = Number(raw.user_id ?? raw.id ?? 0);
  const normalizedEmail = String(raw.user_email ?? raw.email ?? '');
  const normalizedFirstName = (raw.user_fname ?? raw.first_name ?? null) as
    | string
    | null;
  const normalizedLastName = (raw.user_lname ?? raw.last_name ?? null) as
    | string
    | null;
  const normalizedIsActive =
    typeof raw.is_active === 'boolean'
      ? raw.is_active
      : raw.status
        ? raw.status !== 'suspended'
        : true;

  return {
    ...raw,
    // Provide both sets of keys for maximum compatibility across frontend and backend
    id: normalizedUserId,
    email: normalizedEmail,
    first_name: normalizedFirstName,
    last_name: normalizedLastName,
    role: normalizedRole,

    user_id: normalizedUserId,
    user_email: normalizedEmail,
    user_fname: normalizedFirstName,
    user_lname: normalizedLastName,
    user_role: normalizedRole,
    is_active: normalizedIsActive
  };
}
