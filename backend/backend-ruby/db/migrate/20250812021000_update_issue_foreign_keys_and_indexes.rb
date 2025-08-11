class UpdateIssueForeignKeysAndIndexes < ActiveRecord::Migration[8.0]
  def change
    # Ensure columns exist
    unless column_exists?(:issues, :unit_id)
      add_column :issues, :unit_id, :uuid, null: true
    end
    unless column_exists?(:issues, :tenant_id)
      add_column :issues, :tenant_id, :uuid, null: true
    end

    # Foreign keys with nullify on delete
    unless foreign_key_exists?(:issues, :units, column: :unit_id)
      add_foreign_key :issues, :units, column: :unit_id, on_delete: :nullify
    end
    unless foreign_key_exists?(:issues, :tenants, column: :tenant_id)
      add_foreign_key :issues, :tenants, column: :tenant_id, on_delete: :nullify
    end

    # Indexes
    add_index :issues, [:org_id, :unit_id], if_not_exists: true
    add_index :issues, [:org_id, :tenant_id], if_not_exists: true
    add_index :issues, :created_at, if_not_exists: true
  end
end


