class Unit < ApplicationRecord
  belongs_to :org
  has_many :tenants

  validates :name, presence: true
  validates :monthly_rent, numericality: true, allow_nil: true
end


