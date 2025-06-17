/*
  # Add default categories and sample data

  1. Default Categories
    - Income categories: Salario, Inversiones, Freelance, Bonos, Otros Ingresos
    - Expense categories: Alimentación, Transporte, Vivienda, Entretenimiento, Salud, Educación, Servicios, Compras

  2. Default Accounts
    - Sample accounts for new users

  3. Sample Transactions
    - Some example transactions to demonstrate the app

  This migration will be executed when users first sign up to populate their account with useful default data.
*/

-- Function to create default data for new users
CREATE OR REPLACE FUNCTION create_default_user_data(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO categories (id, user_id, name, type, color, icon) VALUES
    (gen_random_uuid(), user_id, 'Salario', 'income', '#10B981', 'Briefcase'),
    (gen_random_uuid(), user_id, 'Inversiones', 'income', '#3B82F6', 'TrendingUp'),
    (gen_random_uuid(), user_id, 'Freelance', 'income', '#8B5CF6', 'Monitor'),
    (gen_random_uuid(), user_id, 'Bonos', 'income', '#F59E0B', 'Gift'),
    (gen_random_uuid(), user_id, 'Otros Ingresos', 'income', '#06B6D4', 'Plus');

  -- Insert default expense categories
  INSERT INTO categories (id, user_id, name, type, color, icon) VALUES
    (gen_random_uuid(), user_id, 'Alimentación', 'expense', '#F59E0B', 'Utensils'),
    (gen_random_uuid(), user_id, 'Transporte', 'expense', '#EF4444', 'Car'),
    (gen_random_uuid(), user_id, 'Vivienda', 'expense', '#6B7280', 'Home'),
    (gen_random_uuid(), user_id, 'Entretenimiento', 'expense', '#EC4899', 'Film'),
    (gen_random_uuid(), user_id, 'Salud', 'expense', '#14B8A6', 'Heart'),
    (gen_random_uuid(), user_id, 'Educación', 'expense', '#6366F1', 'BookOpen'),
    (gen_random_uuid(), user_id, 'Servicios', 'expense', '#84CC16', 'Zap'),
    (gen_random_uuid(), user_id, 'Compras', 'expense', '#F97316', 'ShoppingBag');

  -- Insert default accounts
  INSERT INTO accounts (id, user_id, name, type, balance, color) VALUES
    (gen_random_uuid(), user_id, 'Cuenta Corriente', 'checking', 5000.00, '#3B82F6'),
    (gen_random_uuid(), user_id, 'Ahorros', 'savings', 15000.00, '#10B981'),
    (gen_random_uuid(), user_id, 'Efectivo', 'cash', 500.00, '#F59E0B');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include default data creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the user profile
  INSERT INTO public.profiles (id, name, avatar_url, currency, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.raw_user_meta_data->>'avatar_url',
    'MXN',
    NOW(),
    NOW()
  );

  -- Create default data for the new user
  PERFORM create_default_user_data(NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile or default data for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;