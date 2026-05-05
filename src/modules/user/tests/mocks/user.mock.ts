import { User } from '../../entities/user.entity';

export const mockUser: User = {
  id: 'user1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  password: 'hashedpassword',
  phone: '1234567890',
  is_active: true,
  attempts_left: 3,
  time_left: null,
  secret: 'secret',
  is_2fa_enabled: false,
  profile: null,
  status: 'active',
  backup_codes: [],
  created_at: new Date(),
  updated_at: new Date(),
  notifications: [],
  hashPassword: () => null,
  is_superadmin: false,
};
