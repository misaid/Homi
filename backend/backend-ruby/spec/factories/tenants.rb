FactoryBot.define do
  factory :tenant do
    association :org
    association :unit
    full_name { Faker::Name.name }
    email { Faker::Internet.email }
    phone { Faker::PhoneNumber.cell_phone_in_e164 }
    lease_start { Date.today }
    lease_end { 1.year.from_now }
  end
end


