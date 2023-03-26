import * as bcrypt from 'bcrypt';

export const encryptPassword = (password: string) =>
  bcrypt.hashSync(password, 10);

export const validatePassword = (password: string, encryptedPassword: string) =>
  bcrypt.compareSync(password, encryptedPassword);
