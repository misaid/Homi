class AddUniqueIndexOnPaymentsTenantAndDueDate < ActiveRecord::Migration[8.0]
  def change
    # Ensure each tenant has at most one payment per due_date (month)
    add_index :payments,
              %i[tenant_id due_date],
              unique: true,
              name: "idx_payments_unique_tenant_month"

    # Optional override for a tenant's rent amount
    add_column :tenants, :rent_amount, :decimal, precision: 10, scale: 2
  end
end
