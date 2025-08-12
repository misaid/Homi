class UnitSerializer
  def initialize(unit)
    @unit = unit
  end

  def as_json
    {
      id: @unit.id,
      name: @unit.name,
      address: @unit.address,
      monthly_rent: @unit.monthly_rent,
      notes: @unit.notes,
      image_url: @unit.image_url,
      beds: @unit.try(:beds),
      baths: @unit.try(:baths),
      occupants_count: @unit.try(:occupants_count)
    }
  end
end


