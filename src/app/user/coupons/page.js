// File: src/pages/user/coupons.js
import { UserService } from '@/lib/service/userService';
import UserCouponsClient from '@/components/user/UserCouponsClient';
import { redirect } from 'next/navigation';

export default async function UserCouponsPage() {
  // Get user session on server side
  const { success: sessionSuccess, user } = await UserService.getUserSession();

  if (!sessionSuccess || !user) {
    redirect('/login');
  }

  // Fetch user coupons on server side
  const { success: couponsSuccess, data: couponsData } = await UserService.getUserCoupons(user.id);

  if (!couponsSuccess) {
    console.error('Failed to fetch user coupons');
    // You might want to show an error state to the user
  }

  const { userCoupons = [], availableCoupons = [] } = couponsData || {};

  return (
    <UserCouponsClient
      initialUserCoupons={userCoupons}
      initialAvailableCoupons={availableCoupons}
    />
  );
}
