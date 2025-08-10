class OrgResolver
  # Returns the UUID of the resolved or newly created Org as a string
  def self.resolve_and_ensure!(clerk_org_id:, fallback_name:, user_id:)
    new.resolve_and_ensure!(clerk_org_id: clerk_org_id, fallback_name: fallback_name, user_id: user_id)
  end

  def resolve_and_ensure!(clerk_org_id:, fallback_name:, user_id:)
    if clerk_org_id.present?
      if (mapping = ClerkOrgMap.find_by(clerk_org_id: clerk_org_id))
        return mapping.org_id
      end

      org_name = fallback_name.presence || "New Org"
      org = nil
      ActiveRecord::Base.transaction do
        org = Org.create!(name: org_name)
        begin
          ClerkOrgMap.create!(clerk_org_id: clerk_org_id, org_id: org.id)
        rescue ActiveRecord::RecordNotUnique, ActiveRecord::StatementInvalid
          mapping = ClerkOrgMap.find_by!(clerk_org_id: clerk_org_id)
          org = mapping.org
        end
      end
      return org.id
    else
      # Personal org per user, idempotent by owner_user_id
      org = Org.find_or_create_by!(owner_user_id: user_id) do |o|
        o.name = "Personal Org"
      end
      return org.id
    end
  end
end


