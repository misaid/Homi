class Issue < ApplicationRecord
  belongs_to :org
  belongs_to :user, class_name: "User", foreign_key: :creator_id, optional: true
  belongs_to :unit, optional: true
  belongs_to :tenant, optional: true

  enum :severity, { low: "low", medium: "medium", high: "high", critical: "critical" }, validate: false
  enum :status, { open: "open", in_progress: "in_progress", resolved: "resolved", closed: "closed" }, validate: false

  validates :title, presence: true, length: { maximum: 120 }
  validates :description, length: { maximum: 500 }, allow_nil: true
  validates :severity, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :org_id, presence: true
end


