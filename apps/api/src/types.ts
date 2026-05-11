export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

export type AppPrisma = {
  user: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  customerProfile: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  vehicle: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  workOrder: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  appointment: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  invoice: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  payment: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
  };
  pesapalTransaction: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  feedback: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
  };
  inspection: {
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  labourLog: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  partsRequest: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
  supplier: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  purchaseOrder: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  expense: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  service: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
    delete(args: Record<string, unknown>): Promise<any>;
  };
  attendance: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
  };
  auditLog: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
  };
  systemSetting: {
    findUnique(args: Record<string, unknown>): Promise<any>;
    upsert(args: Record<string, unknown>): Promise<any>;
  };
  notification: {
    findMany(args?: Record<string, unknown>): Promise<any[]>;
    create(args: Record<string, unknown>): Promise<any>;
    update(args: Record<string, unknown>): Promise<any>;
  };
};

export type AppMailer = {
  sendMail(message: {
    to: string;
    from?: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
};

export type UploadObjectInput = {
  purpose: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

export type UploadedObject = {
  objectKey: string;
  objectUrl: string;
  size: number;
  mimetype: string;
};

export type ObjectStorageAdapter = {
  putObject(input: UploadObjectInput): Promise<UploadedObject>;
};

export type AppRealtime = {
  emitWorkOrderStatus(payload: {
    workOrderId: string;
    status: string;
    assignedMechanicId?: string | null;
  }): void;
  emitNotification(payload: {
    recipientId: string;
    notification: unknown;
  }): void;
};

export type AppDeps = {
  prisma: AppPrisma;
  mailer: AppMailer;
  jwtSecret: string;
  refreshTokenSecret: string;
  uploadStorage?: ObjectStorageAdapter;
  uploadMaxBytes?: number;
  notificationService?: {
    enqueue(job: {
      type: string;
      recipientId: string;
      channel: string;
      title: string;
      body: string;
      to?: string | null;
      metadata?: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

declare module "fastify" {
  interface FastifyInstance {
    deps: AppDeps;
    realtime: AppRealtime;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
