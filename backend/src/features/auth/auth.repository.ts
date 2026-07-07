import { UserModel, UserDocument } from '../users/user.model';

export async function findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
  const query = UserModel.findOne({ email });
  if (withPassword) {
    query.select('+passwordHash');
  }
  return query.exec();
}

export async function findById(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).exec();
}

export async function findByIdWithRefreshHash(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).select('+refreshTokenHash').exec();
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  authProvider: 'local' | 'google';
}

export async function create(data: CreateUserInput): Promise<UserDocument> {
  return UserModel.create(data);
}

export interface FindOrCreateGoogleUserInput {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export async function findOrCreateGoogleUser(data: FindOrCreateGoogleUserInput): Promise<UserDocument> {
  const existingByGoogleId = await UserModel.findOne({ googleId: data.googleId }).exec();
  if (existingByGoogleId) {
    return existingByGoogleId;
  }

  const existingByEmail = await UserModel.findOne({ email: data.email }).exec();
  if (existingByEmail) {
    existingByEmail.googleId = data.googleId;
    if (!existingByEmail.avatarUrl && data.avatarUrl) {
      existingByEmail.avatarUrl = data.avatarUrl;
    }
    await existingByEmail.save();
    return existingByEmail;
  }

  return UserModel.create({
    googleId: data.googleId,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    authProvider: 'google',
  });
}

export async function setRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
  if (hash === null) {
    await UserModel.updateOne({ _id: userId }, { $unset: { refreshTokenHash: '' } }).exec();
    return;
  }
  await UserModel.updateOne({ _id: userId }, { $set: { refreshTokenHash: hash } }).exec();
}
