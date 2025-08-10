class Payment < ApplicationRecord
  belongs_to :org
  belongs_to :tenant

  enum :status, { due: "due", paid: "paid" }, validate: false
  enum :method, { cash: "cash", transfer: "transfer", other: "other" }, validate: false

  scope :between, ->(from, to) { where(due_date: from..to) }

  validates :tenant_id, :due_date, :amount, presence: true
end


