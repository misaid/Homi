class Unit < ApplicationRecord
  belongs_to :org
  has_many :tenants, dependent: :nullify

  validates :name, presence: true
  validates :monthly_rent, numericality: true, allow_nil: true
  # photos is a jsonb array of strings (URLs). Default [] handled at DB level.
end


