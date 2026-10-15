import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { encryptPii, last4 } from '../common/crypto';
import { DB, type Database } from '../db/db.module';
import { vendorPayoutAccounts, vendors } from '../db/schema';
import { PaystackService } from '../payments/paystack.service';
import { AuditService } from './audit.service';

/** The vendor's own bank account that Paystack settles their online payments to. */
@Injectable()
export class PayoutAccountService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly paystack: PaystackService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  private bankCache: { at: number; banks: { name: string; code: string }[] } | null = null;

  /** Bank list, cached for a day — it rarely changes and every account save needs a name. */
  async banks() {
    if (!this.bankCache || Date.now() - this.bankCache.at > 86_400_000) {
      this.bankCache = { at: Date.now(), banks: await this.paystack.listBanks() };
    }
    return this.bankCache.banks;
  }

  async bankName(code: string) {
    return (await this.banks()).find((b) => b.code === code)?.name ?? 'Bank';
  }

  async resolve(bankCode: string, accountNumber: string) {
    if (!this.config.get<string>('PAYSTACK_SECRET_KEY')) {
      // A server problem, not the user's: don't tell them their account is wrong.
      throw new ServiceUnavailableException("Bank checks aren't available right now. Please try again later.");
    }
    try {
      return { accountName: await this.paystack.resolveAccountName(accountNumber, bankCode) };
    } catch {
      throw new BadRequestException("We couldn't find that account. Check the bank and account number.");
    }
  }

  /** Masked view: never returns the full account number. */
  async get(vendorId: string) {
    const [row] = await this.db.select().from(vendorPayoutAccounts).where(eq(vendorPayoutAccounts.vendorId, vendorId));
    if (!row) return null;
    return {
      bankName: row.bankName,
      accountLast4: row.accountLast4,
      accountName: row.accountName,
      onlinePaymentsEnabled: !!row.paystackSubaccountCode,
      verifiedAt: row.verifiedAt,
    };
  }

  /**
   * Verifies the account with the bank, then creates (or updates) the vendor's
   * Paystack subaccount so customer payments settle straight to it.
   */
  async save(vendorId: string, actorStaffId: string, bankCode: string, accountNumber: string) {
    const [vendor] = await this.db.select({ name: vendors.businessName }).from(vendors).where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    const { accountName } = await this.resolve(bankCode, accountNumber);
    const bankName = await this.bankName(bankCode);

    const commission = Number(this.config.get('PLATFORM_COMMISSION_PERCENT') ?? 0);
    const input = { businessName: vendor.name, bankCode, accountNumber, percentageCharge: commission };
    const [existing] = await this.db.select().from(vendorPayoutAccounts).where(eq(vendorPayoutAccounts.vendorId, vendorId));
    let subaccountCode = existing?.paystackSubaccountCode ?? null;
    if (subaccountCode) await this.paystack.updateSubaccount(subaccountCode, input);
    else subaccountCode = await this.paystack.createSubaccount(input);

    const values = {
      bankCode,
      bankName,
      accountNumberEnc: encryptPii(accountNumber),
      accountLast4: last4(accountNumber),
      accountName,
      paystackSubaccountCode: subaccountCode,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    };
    await this.db
      .insert(vendorPayoutAccounts)
      .values({ vendorId, ...values })
      .onConflictDoUpdate({ target: vendorPayoutAccounts.vendorId, set: values });
    await this.audit.record({
      vendorId,
      actorStaffId,
      action: existing ? 'payout_account.changed' : 'payout_account.added',
      entityType: 'vendor_payout_account',
      entityId: vendorId,
      details: { bankName, accountLast4: last4(accountNumber), previousLast4: existing?.accountLast4 ?? null },
    });
    return this.get(vendorId);
  }
}
