class AddUnitAttrsAndPhotos < ActiveRecord::Migration[8.0]
  def change
    add_column :units, :beds, :integer, null: true
    add_column :units, :baths, :decimal, precision: 4, scale: 1, null: true
    add_column :units, :photos, :jsonb, null: false, default: []
  end
end


