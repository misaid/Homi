class UpdateFkTenantsUnitOnDeleteNullify < ActiveRecord::Migration[8.0]
  def up
    if foreign_key_exists?(:tenants, :units)
      remove_foreign_key :tenants, :units
    end

    add_foreign_key :tenants, :units, column: :unit_id, on_delete: :nullify

    unless index_exists?(:tenants, :unit_id)
      add_index :tenants, :unit_id
    end
  end

  def down
    if foreign_key_exists?(:tenants, :units)
      remove_foreign_key :tenants, :units
    end
    add_foreign_key :tenants, :units, column: :unit_id
  end
end


