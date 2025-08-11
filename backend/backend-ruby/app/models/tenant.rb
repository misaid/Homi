class Tenant < ApplicationRecord
  belongs_to :org
  belongs_to :unit, optional: true
  has_many :payments, dependent: :destroy

  validates :full_name, presence: true

  scope :for_org, ->(org_id) { where(org_id: org_id) }
  scope :search_q, lambda { |q|
    q = q.to_s.strip
    if q.present?
      like = "%#{q}%"
      where("full_name ILIKE :q OR email ILIKE :q OR phone ILIKE :q", q: like)
    else
      all
    end
  }

  after_commit :generate_initial_schedule_async, on: :create
  after_commit :regenerate_schedule_if_terms_changed_async, on: :update

  private

  def generate_initial_schedule_async
    return if Rails.env.test?
    # On first registration, assume prior rent is settled; start generating from today or lease_start, whichever is later
    start_on_effective = lease_start.present? ? [lease_start, Date.current].max : nil
    Payments::GenerateScheduleJob.enqueue(
      tenant_id: id,
      start_on: start_on_effective,
      end_on: lease_end
    )
  end

  def regenerate_schedule_if_terms_changed_async
    if (previous_changes.keys & %w[lease_start lease_end unit_id rent_amount]).any?
      return if Rails.env.test?
      Payments::GenerateScheduleJob.enqueue(
        tenant_id: id,
        start_on: lease_start,
        end_on: lease_end
      )
    end
  end
end


