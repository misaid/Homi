class AddIndexesToTenantsSearch < ActiveRecord::Migration[7.1]
  def change
    add_index :tenants, [:org_id, :full_name]
    add_index :tenants, [:org_id, :email]
    add_index :tenants, [:org_id, :phone]
  end
end


