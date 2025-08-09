module V1
  class PaymentsController < ApplicationController
    before_action :require_organization!
    before_action :set_payment, only: %i[show update destroy pay]

    def index
      payments = Payment.where(org_id: current_org_id)
      if params[:status].present?
        payments = payments.where(status: params[:status])
      end
      if params[:from].present?
        from_date = Date.parse(params[:from]) rescue nil
        payments = payments.where("due_date >= ?", from_date) if from_date
      end
      if params[:to].present?
        to_date = Date.parse(params[:to]) rescue nil
        payments = payments.where("due_date <= ?", to_date) if to_date
      end
      pagy_obj, records = pagy(payments.order(due_date: :asc), page: params[:page], items: params[:limit])
      render json: {
        items: records,
        page: pagy_obj.page,
        limit: pagy_obj.items,
        total: pagy_obj.count,
        hasMore: !!pagy_obj.next
      }
    end

    def show
      render json: @payment
    end

    def create
      payment = Payment.new(payment_params.merge(org_id: current_org_id))
      if payment.save
        render json: payment, status: :created
      else
        render json: { errors: payment.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @payment.update(payment_params)
        render json: @payment
      else
        render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @payment.destroy
      head :no_content
    end

    def pay
      @payment.update(status: "paid", paid_at: Time.current, method: params[:method], note: params[:note])
      render json: @payment
    end

    private

    def set_payment
      @payment = Payment.where(org_id: current_org_id).find(params[:id])
    end

    def payment_params
      params.require(:payment).permit(:tenant_id, :due_date, :amount, :status, :paid_at, :method, :note)
    end
  end
end


