import { describe, expect, it, vi } from 'vitest';
import { requireRoles } from './rbac.js';

function replyMock() {
  return {
    unauthorized: vi.fn(),
    forbidden: vi.fn(),
  };
}

describe('requireRoles', () => {
  it('allows admin to access admin routes', async () => {
    const reply = replyMock();
    await requireRoles('admin')({ user: { id: '1', email: 'admin@example.com', role: 'admin' } } as never, reply as never);

    expect(reply.unauthorized).not.toHaveBeenCalled();
    expect(reply.forbidden).not.toHaveBeenCalled();
  });

  it('rejects mechanic from admin routes', async () => {
    const reply = replyMock();
    await requireRoles('admin')(
      { user: { id: '2', email: 'mechanic@example.com', role: 'mechanic' } } as never,
      reply as never,
    );

    expect(reply.forbidden).toHaveBeenCalledWith('You do not have permission to access this resource');
  });

  it('rejects anonymous requests', async () => {
    const reply = replyMock();
    await requireRoles('admin')({} as never, reply as never);

    expect(reply.unauthorized).toHaveBeenCalledWith('Authentication is required');
  });
});
