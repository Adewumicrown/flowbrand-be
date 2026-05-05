import { Profile } from '../../../modules/profile/entities/profile.entity';
import { User, UserType } from '../../user/entities/user.entity';

const profile = new Profile();
export const mockUserWithProfile: User = {
  email: 'tester@example.com',
  status: null,
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_superadmin: false,
  phone: '+1234567891',
  id: 'some-uuid-value-here',
  attempts_left: 2,
  created_at: new Date(),
  updated_at: new Date(),
  backup_codes: [],
  hashPassword: () => null,
  password: 'password123',
  time_left: 5,
  secret: 'secret',
  is_2fa_enabled: true,
  profile: null,
  notifications: [],
};

export const mockUser: User = {
  email: 'tester@example.com',
  status: null,
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_superadmin: false,
  phone: '+1234567891',
  id: 'some-uuid-value-here',
  attempts_left: 2,
  created_at: new Date(),
  updated_at: new Date(),
  backup_codes: [],
  hashPassword: () => null,
  password: 'password123',
  time_left: 5,
  secret: 'secret',
  is_2fa_enabled: true,
  profile: {
    id: 'profile-uuid-value-here',
    profile_pic_url: 'http://localhost:3000/uploads/some-uuid-value-here.jpg',
  } as Profile,
  notifications: [],
};
