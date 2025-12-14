import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  status: 'active' | 'unregistered' | 'suspended';
  created_at: string;
  updated_at: string;
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const fakeUsers = {
  records: [] as User[],
  initialize() {
    const roles: User['role'][] = ['student', 'lecturer', 'admin'];
    const statuses: User['status'][] = ['active', 'unregistered', 'suspended'];
    const sample: User[] = [];

    for (let i = 1; i <= 50; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      sample.push({
        id: i,
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }),
        role: faker.helpers.arrayElement(roles),
        status: faker.helpers.arrayElement(statuses),
        created_at: faker.date
          .between({ from: '2023-01-01', to: '2024-12-31' })
          .toISOString(),
        updated_at: faker.date.recent().toISOString()
      });
    }

    this.records = sample;
  },
  async getAll({
    role,
    status,
    search
  }: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    let users = [...this.records];
    if (role) users = users.filter((u) => u.role === role);
    if (status) users = users.filter((u) => u.status === status);
    if (search) {
      users = matchSorter(users, search, {
        keys: ['firstName', 'lastName', 'email', 'role', 'status']
      });
    }
    return users;
  },
  async getUsers({
    page = 1,
    limit = 10,
    role,
    status,
    search
  }: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    await delay(400);
    const all = await this.getAll({ role, status, search });
    const total = all.length;
    const offset = (page - 1) * limit;
    const sliced = all.slice(offset, offset + limit);
    return {
      success: true,
      time: new Date().toISOString(),
      message: 'Sample users for testing and learning',
      total_users: total,
      offset,
      limit,
      users: sliced
    };
  },
  async getUserById(id: number) {
    await delay(300);
    const user = this.records.find((u) => u.id === id) || null;
    if (!user)
      return { success: false, message: `User ${id} not found` } as const;
    return { success: true, user } as const;
  }
};

fakeUsers.initialize();
