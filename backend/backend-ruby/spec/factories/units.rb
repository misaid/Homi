FactoryBot.define do
  factory :unit do
    association :org
    name { "Unit #{Faker::Alphanumeric.alpha(number: 3).upcase}" }
    address { Faker::Address.full_address }
    monthly_rent { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
    beds { [1,2,3,4].sample }
    baths { [1.0,1.5,2.0,2.5,3.0].sample }
    photos { [] }
  end
end


