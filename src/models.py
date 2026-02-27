class Branch(models.Model):
    name = models.CharField(max_length=100)
    branch_code = models.CharField(max_length=10, unique=True)
    county = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.branch_code})"


class Currency(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.code


class AccountType(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    minimum_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class AddOn(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class AccountTypeAddOn(models.Model):
    account_type = models.ForeignKey(AccountType, on_delete=models.CASCADE)
    addon = models.ForeignKey(AddOn, on_delete=models.CASCADE)
    is_recommended = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False)

    class Meta:
        unique_together = ('account_type', 'addon')

# =========================================================
# SERVICE GROUP (HIGH LEVEL CATEGORY)
# =========================================================

class APIServiceGroup(models.Model):

    branch = models.ForeignKey(
        "Branch",
        on_delete=models.PROTECT,
        related_name="service_groups"
    )

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    def __str__(self):
        return self.name
# =========================================================
# SERVICE TYPE (ACTUAL SERVICE UNDER GROUP)
# =========================================================

class APIServiceType(models.Model):

    service_group = models.ForeignKey(
        APIServiceGroup,
        on_delete=models.CASCADE,
        related_name="service_types"
    )

    branch = models.ForeignKey(
        "Branch",
        on_delete=models.PROTECT,
        related_name="service_types"
    )

    code = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    requires_approval = models.BooleanField(default=True)
    service_fee = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    sla_days = models.IntegerField(default=1)  # Service Level Agreement

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('service_group', 'code')

    def __str__(self):
        return f"{self.service_group.name} - {self.name}"


# =========================================================
# CUSTOMER MODULE
# =========================================================

class Customer(models.Model):

    RISK_LEVEL = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    )

    GENDER = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )

    MARITAL_STATUS = (
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="customers")

    full_name = models.CharField(max_length=200)
    national_id = models.CharField(max_length=20, unique=True)
    kra_pin = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS)

    mobile_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)

    occupation = models.CharField(max_length=100)
    employer_name = models.CharField(max_length=200, blank=True, null=True)
    employer_address = models.TextField(blank=True, null=True)
    monthly_income_range = models.CharField(max_length=100)

    county = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    postal_address = models.CharField(max_length=100)
    physical_address = models.TextField()

    pep_status = models.BooleanField(default=False)
    risk_rating = models.CharField(max_length=10, choices=RISK_LEVEL, default='LOW')
    aml_screening_status = models.CharField(max_length=20, default="CLEAR")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class KYCDocument(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name="kyc")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    national_id_copy = models.FileField(upload_to='kyc/', blank=True, null=True)
    kra_pin_certificate = models.FileField(upload_to='kyc/', blank=True, null=True)
    passport_photo = models.ImageField(upload_to='kyc/', blank=True, null=True)

    passport_copy = models.FileField(upload_to='kyc/', blank=True, null=True)
    alien_id = models.FileField(upload_to='kyc/', blank=True, null=True)
    work_permit = models.FileField(upload_to='kyc/', blank=True, null=True)
    visa_copy = models.FileField(upload_to='kyc/', blank=True, null=True)

    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(blank=True, null=True)


class NextOfKin(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="next_of_kin")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    full_name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=100)
    id_number = models.CharField(max_length=20)
    mobile_number = models.CharField(max_length=15)
    physical_address = models.TextField()


# =========================================================
# ACCOUNT MODULE
# =========================================================

class CustomerAccount(models.Model):

    ACCOUNT_STATUS = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('ACTIVE', 'Active'),
        ('REJECTED', 'Rejected'),
        ('DORMANT', 'Dormant'),
    )

    ACCOUNT_CATEGORY = (
        ('INDIVIDUAL', 'Individual'),
        ('JOINT', 'Joint'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="accounts")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="accounts")
    account_type = models.ForeignKey(AccountType, on_delete=models.PROTECT)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)

    account_number = models.CharField(max_length=20, unique=True, default=generate_account_number)
    account_category = models.CharField(max_length=20, choices=ACCOUNT_CATEGORY)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    mode_of_operation = models.CharField(max_length=50)
    source_of_funds = models.CharField(max_length=200)
    expected_monthly_transaction_volume = models.DecimalField(max_digits=15, decimal_places=2)

    status = models.CharField(max_length=20, choices=ACCOUNT_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.account_number


class CustomerAccountAddOn(models.Model):
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    addon = models.ForeignKey(AddOn, on_delete=models.CASCADE)
    activated = models.BooleanField(default=True)
    activated_date = models.DateTimeField(auto_now_add=True)


class JointHolder(models.Model):
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE, related_name="joint_holders")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    full_name = models.CharField(max_length=200)
    national_id = models.CharField(max_length=20)
    kra_pin = models.CharField(max_length=20)
    mobile = models.CharField(max_length=15)
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True)
    passport_photo = models.ImageField(upload_to='photos/', blank=True, null=True)


# =========================================================
# KYC UPDATE & ACCOUNT MODIFICATION
# =========================================================

class KYCUpdateRequest(models.Model):
    STATUS = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    update_type = models.CharField(max_length=100)
    old_value = models.TextField()
    new_value = models.TextField()
    reason = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AccountModificationRequest(models.Model):
    MODIFICATION_TYPE = (
        ('ADD_JOINT', 'Add Joint Holder'),
        ('CHANGE_MODE', 'Change Mode'),
        ('UPDATE_NOK', 'Update NOK'),
        ('UPGRADE_ACCOUNT', 'Upgrade Account'),
        ('CHANGE_SIGNATORY', 'Change Signatory'),
        ('REACTIVATE', 'Dormant Reactivation'),
    )

    STATUS = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    modification_type = models.CharField(max_length=50, choices=MODIFICATION_TYPE)
    description = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='mod_requested')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='mod_approved')

    created_at = models.DateTimeField(auto_now_add=True)


# =========================================================
# CASH OPERATIONS
# =========================================================

class CashDeposit(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.TextField()
    reference = models.CharField(max_length=30, unique=True, default=generate_dep_reference)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class CashWithdrawal(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.TextField()
    reference = models.CharField(max_length=30, unique=True, default=generate_wdl_reference)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)



# =========================================================
# CASH OPERATIONS - DENOMINATION EXCHANGE (FX BUY / SELL)
# =========================================================

class DenominationExchange(models.Model):

    DIRECTION = (
        ('BUY', 'Buy Foreign Currency'),
        ('SELL', 'Sell Foreign Currency'),
    )

    SETTLEMENT_METHOD = (
        ('ACCOUNT_CREDIT', 'Credit to Settlement Account'),
        ('CASH_COLLECTION', 'Cash Collection'),
        ('WIRE_TRANSFER', 'Wire Transfer (T+1)'),
    )

    STATUS = (
        ('PENDING', 'Pending'),
        ('VALIDATION', 'Under Validation'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    teller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    transaction_reference = models.CharField(
        max_length=30,
        unique=True,
        default=generate_fxc_reference
    )

    direction = models.CharField(max_length=10, choices=DIRECTION)

    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)

    fcy_amount = models.DecimalField(max_digits=15, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4)
    kes_equivalent = models.DecimalField(max_digits=15, decimal_places=2)

    source_account = models.ForeignKey(
        CustomerAccount,
        on_delete=models.CASCADE,
        related_name="fx_source"
    )

    settlement_method = models.CharField(max_length=20, choices=SETTLEMENT_METHOD)

    settlement_account = models.ForeignKey(
        CustomerAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fx_settlement"
    )

    # Wire transfer fields
    payment_rail = models.CharField(max_length=50, blank=True, null=True)
    beneficiary_name = models.CharField(max_length=200, blank=True, null=True)
    beneficiary_account_number = models.CharField(max_length=50, blank=True, null=True)
    beneficiary_bank = models.CharField(max_length=200, blank=True, null=True)
    bank_code = models.CharField(max_length=50, blank=True, null=True)
    bank_country = models.CharField(max_length=100, blank=True, null=True)
    intermediary_bank = models.CharField(max_length=200, blank=True, null=True)
    purpose_of_payment = models.CharField(max_length=200, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')

    created_at = models.DateTimeField(auto_now_add=True)


# =========================================================
# PAYMENT OPERATIONS
# =========================================================

class Biller(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    paybill_number = models.CharField(max_length=20)
    category = models.CharField(max_length=100)
    bill_fetch_supported = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)


class FundsTransfer(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    source_account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    beneficiary_account = models.CharField(max_length=50)
    beneficiary_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    narration = models.TextField(blank=True, null=True)
    reference = models.CharField(max_length=30, unique=True, default=generate_trf_reference)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class BillPayment(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    source_account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    biller = models.ForeignKey(Biller, on_delete=models.SET_NULL, null=True, blank=True)
    biller_name = models.CharField(max_length=200)
    paybill_number = models.CharField(max_length=20)
    reference_number = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class StandingOrder(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    source_account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    beneficiary_account = models.CharField(max_length=50)
    beneficiary_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    frequency = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


# =========================================================
# CARD SERVICES
# =========================================================

class Card(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    card_number = models.CharField(max_length=16, unique=True, default=generate_card_number)
    card_type = models.CharField(max_length=20)
    card_tier = models.CharField(max_length=20)
    name_on_card = models.CharField(max_length=26)
    daily_pos_limit = models.DecimalField(max_digits=15, decimal_places=2)
    daily_atm_limit = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)


class CardReplacement(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT,related_name="card_replacements")
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    reason = models.CharField(max_length=20)
    delivery_method = models.CharField(max_length=20)
    pickup_branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True,related_name="pickup_card_replacements")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)



# =========================================================
# CARD PIN STORAGE (HASHED)
# =========================================================

class CardPIN(models.Model):

    card = models.OneToOneField(Card, on_delete=models.CASCADE, related_name="pin_data")

    pin_hash = models.CharField(max_length=255)  # Never store plain PIN
    failed_attempts = models.IntegerField(default=0)

    is_blocked = models.BooleanField(default=False)

    last_updated = models.DateTimeField(auto_now=True)


class CardPINAction(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    action = models.CharField(max_length=20)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    performed_at = models.DateTimeField(auto_now_add=True)


class CardLimitUpdate(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    old_pos_limit = models.DecimalField(max_digits=15, decimal_places=2)
    old_atm_limit = models.DecimalField(max_digits=15, decimal_places=2)
    new_pos_limit = models.DecimalField(max_digits=15, decimal_places=2)
    new_atm_limit = models.DecimalField(max_digits=15, decimal_places=2)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# =========================================================
# FX BUY (ACCOUNT BASED)
# =========================================================

class FXBuy(models.Model):

    STATUS = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    transaction_reference = models.CharField(
        max_length=30,
        unique=True,
        default=generate_fxb_reference
    )

    account = models.ForeignKey(
        CustomerAccount,
        on_delete=models.CASCADE,
        related_name="fx_buys"
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4)
    kes_equivalent = models.DecimalField(max_digits=15, decimal_places=2)

    narration = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

# =========================================================
# FX SELL
# =========================================================

class FXSell(models.Model):

    STATUS = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    transaction_reference = models.CharField(
        max_length=30,
        unique=True,
        default=generate_fxs_reference
    )

    account = models.ForeignKey(
        CustomerAccount,
        on_delete=models.CASCADE,
        related_name="fx_sells"
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4)
    kes_equivalent = models.DecimalField(max_digits=15, decimal_places=2)

    narration = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

# =========================================================
# FX TRANSFER (INTERNATIONAL WIRE)
# =========================================================

class FXTransfer(models.Model):

    STATUS = (
        ('PENDING', 'Pending'),
        ('VALIDATION', 'Under Validation'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    transaction_reference = models.CharField(
        max_length=30,
        unique=True,
        default=generate_fxt_reference
    )

    account = models.ForeignKey(
        CustomerAccount,
        on_delete=models.CASCADE,
        related_name="fx_transfers"
    )

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    charges = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    beneficiary_name = models.CharField(max_length=200)
    beneficiary_account_number = models.CharField(max_length=50)
    beneficiary_bank = models.CharField(max_length=200)
    swift_code = models.CharField(max_length=20)
    beneficiary_country = models.CharField(max_length=100)

    narration = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)


# =========================================================
# SERVICE REQUESTS
# =========================================================

class ChequeBookRequest(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    number_of_leaves = models.IntegerField()
    collection_branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="cheque_collection")
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class StatementRequest(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)
    account = models.ForeignKey(CustomerAccount, on_delete=models.CASCADE)
    statement_type = models.CharField(max_length=20)
    date_from = models.DateField(blank=True, null=True)
    date_to = models.DateField(blank=True, null=True)
    output_format = models.CharField(max_length=20)
    delivery_email = models.EmailField(blank=True, null=True)
    certified_statement = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)