class Tenant < ApplicationRecord
  belongs_to :org
  belongs_to :unit, optional: true
  has_many :payments, dependent: :destroy

  validates :full_name, presence: true

  after_commit :generate_initial_schedule_async, on: :create
  after_commit :regenerate_schedule_if_terms_changed_async, on: :update

  private

  def generate_initial_schedule_async
    return if Rails.env.test?
    Payments::GenerateScheduleJob.enqueue(
      tenant_id: id,
      start_on: lease_start,
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


