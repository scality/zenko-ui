import Joi from 'joi';
import { accountValidator, iamValidator } from './validators';

const schema = Joi.object({ ...accountValidator, ...iamValidator }).unknown(true);

describe('account and IAM user validators', () => {
  it('should keep padded names unchanged when both account and IAM user already exist', () => {
    const { error, value } = schema.validate({
      accountName: 'acct ',
      accountNameType: 'existing',
      IAMUserName: 'svc ',
      IAMUserNameType: 'existing',
    });

    expect(error).toBeUndefined();
    expect(value.accountName).toBe('acct ');
    expect(value.IAMUserName).toBe('svc ');
  });

  it('should trim padded names in create mode', () => {
    const { error, value } = schema.validate({
      accountName: '  acct  ',
      accountNameType: 'create',
    });

    expect(error).toBeUndefined();
    expect(value.accountName).toBe('acct');
  });

  it('should trim a padded IAM user name when it is being created for an existing account', () => {
    const { error, value } = schema.validate({
      accountName: 'acct',
      accountNameType: 'existing',
      IAMUserName: ' svc ',
      IAMUserNameType: 'create',
    });

    expect(error).toBeUndefined();
    expect(value.IAMUserName).toBe('svc');
  });
});
