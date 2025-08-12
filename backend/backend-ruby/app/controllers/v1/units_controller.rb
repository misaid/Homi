module V1
  class UnitsController < ApplicationController
    before_action :require_organization!
    before_action :set_unit, only: %i[show update destroy]

    def index
      base_scope = Unit.where(org_id: current_org_id)
      base_scope = base_scope.left_joins(:tenants)
                             .select('units.*, COUNT(tenants.id) AS occupants_count')
                             .group('units.id')

      # Optional case-insensitive query by name or address
      if params[:q].present?
        q = "%#{params[:q].to_s.strip}%"
        base_scope = base_scope.where("units.name ILIKE :q OR units.address ILIKE :q", q: q)
      end

      pagy_obj, records = pagy(base_scope, page: params[:page], items: params[:limit])
      meta = pagy_metadata(pagy_obj)

      resolver = ::Supabase::UrlResolver.new
      items = records.map do |u|
        attrs = u.attributes.slice('id', 'name', 'address', 'monthly_rent', 'notes', 'beds', 'baths', 'image_url', 'image_key', 'created_at')
        attrs.merge(
          'display_url' => resolver.display_url_for_unit(u),
          'photos' => (u.respond_to?(:photos) && u.photos.is_a?(Array) ? u.photos : []),
          'occupants_count' => u.read_attribute(:occupants_count).to_i
        )
      end

      render json: {
        items: items,
        page: meta[:page],
        limit: meta[:items],
        total: meta[:count],
        hasMore: meta[:page] < meta[:pages]
      }
    end

    def show
      record = Unit.where(org_id: current_org_id)
                   .left_joins(:tenants)
                   .select('units.*, COUNT(tenants.id) AS occupants_count')
                   .group('units.id')
                   .find(params[:id])

      resolver = ::Supabase::UrlResolver.new
      attrs = record.attributes.slice('id', 'name', 'address', 'monthly_rent', 'notes', 'beds', 'baths', 'image_url', 'image_key', 'created_at')
      payload = attrs.merge(
        'display_url' => resolver.display_url_for_unit(record),
        'photos' => (record.respond_to?(:photos) && record.photos.is_a?(Array) ? record.photos : []),
        'occupants_count' => record.read_attribute(:occupants_count).to_i
      )
      render json: payload
    end

    def create
      attrs = unit_params.to_h
      unit = Unit.new(attrs.merge(org_id: current_org_id))
      if unit.save
        render json: unit, status: :created
      else
        render json: { errors: unit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      attrs = unit_params.to_h
      if @unit.update(attrs)
        render json: @unit
      else
        render json: { errors: @unit.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      Rails.logger.info({ event: "units_destroy_start", path: request.path, unit_param_id: params[:id], current_org_id: current_org_id, current_user_id: current_user_id }.to_json)
      Unit.transaction do
        tenants_scope = Tenant.where(unit_id: @unit.id, org_id: current_org_id)
        tenants_count = tenants_scope.count
        Rails.logger.info({ event: "units_destroy_loaded", unit_id: @unit.id, tenants_count: tenants_count }.to_json)

        if params[:force].to_s == "true"
          Rails.logger.info({ event: "units_destroy_force", unit_id: @unit.id, detach_count: tenants_count }.to_json)
          tenants_scope.update_all(unit_id: nil)
          @unit.destroy!
          head :no_content and return
        end

        if tenants_count.positive?
          Rails.logger.info({ event: "units_destroy_conflict", unit_id: @unit.id, tenants_count: tenants_count }.to_json)
          render json: { error: "unit_has_tenants", message: "Cannot delete a unit with assigned tenants. Pass force=true to detach tenants and delete." }, status: :conflict and return
        end

        @unit.destroy!
        Rails.logger.info({ event: "units_destroy_ok", unit_id: @unit.id }.to_json)
        head :no_content
      end
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.info({ event: "units_destroy_not_found", message: e.message }.to_json)
      render json: { error: "Not Found" }, status: :not_found
    rescue ActiveRecord::InvalidForeignKey => e
      Rails.logger.info({ event: "units_destroy_fk_error", message: e.message }.to_json)
      render json: { error: "invalid_foreign_key", message: e.message }, status: :conflict
    rescue StandardError => e
      Rails.logger.info({ event: "units_destroy_error", message: e.message }.to_json)
      render json: { error: "unprocessable_entity", message: e.message }, status: :unprocessable_entity
    end

    private

    def set_unit
      @unit = Unit.where(org_id: current_org_id).find(params[:id])
    end

    def unit_params
      permitted = [:name, :address, :monthly_rent, :notes, :cover_image_uri, :beds, :baths, { photos: [] }]
      source = params[:unit].is_a?(ActionController::Parameters) ? params[:unit] : params
      source.permit(*permitted)
    end

    # Image upload moved to Api::V1::UnitsImagesController
  end
end


