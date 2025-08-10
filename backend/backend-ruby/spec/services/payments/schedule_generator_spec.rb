require 'rails_helper'

RSpec.describe Payments::ScheduleGenerator do
  let(:org) { create(:org) }
  let(:unit) { create(:unit, org: org, monthly_rent: 1234.56) }
  let(:tenant) { create(:tenant, org: org, unit: unit, lease_start: Date.new(2025, 1, 31), lease_end: Date.new(2025, 3, 15)) }

  it 'creates monthly due payments clamping to last day and respecting uniqueness' do
    Payment.create!(org: org, tenant: tenant, due_date: Date.new(2025, 2, 28), amount: 1234.56, status: 'due')

    result = Payments::ScheduleGenerator.call(tenant: tenant, start_on: tenant.lease_start, end_on: tenant.lease_end)

    expect(result.created).to eq(2) # Jan and Mar
    expect(result.skipped).to eq(1) # Feb existed
    expect(result.updated).to eq(0)

    jan = Payment.find_by(tenant: tenant, due_date: Date.new(2025, 1, 31))
    feb = Payment.find_by(tenant: tenant, due_date: Date.new(2025, 2, 28))
    mar = Payment.find_by(tenant: tenant, due_date: Date.new(2025, 3, 31))

    expect(jan).to be_present
    expect(feb).to be_present
    expect(mar).to be_present
    expect([jan.amount, feb.amount, mar.amount]).to all(eq(1234.56))
    expect([jan.status, feb.status, mar.status]).to all(eq('due'))
  end

  it 'uses tenant.rent_amount when present' do
    tenant.update!(rent_amount: 777.77)
    result = Payments::ScheduleGenerator.call(tenant: tenant, start_on: Date.new(2025, 2, 1), end_on: Date.new(2025, 2, 1))
    expect(result.created).to eq(1)
    pmt = Payment.find_by(tenant: tenant, due_date: Date.new(2025, 2, 1))
    expect(pmt.amount.to_d).to eq(777.77.to_d)
  end

  it 'raises when no amount can be determined' do
    tenant_without_rent = create(:tenant, org: org, unit: nil, lease_start: Date.new(2025, 5, 10), lease_end: Date.new(2025, 5, 10))
    expect {
      Payments::ScheduleGenerator.call(tenant: tenant_without_rent, start_on: tenant_without_rent.lease_start, end_on: tenant_without_rent.lease_end)
    }.to raise_error(ArgumentError)
  end
end


