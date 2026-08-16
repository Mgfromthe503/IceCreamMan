# The Ice Cream Man - Mobile App Design

## Overview
A colorful, kid-friendly app that connects ice cream customers with mobile ice cream vendors. Features two distinct user flows: customers summon ice cream trucks with a big ice cream button, and drivers receive real-time alerts and track customer locations.

---

## Screen List

### Customer Side
1. **Splash/Onboarding Screen** - Colorful intro with app branding
2. **Auth Screen** - Login/Sign up (email or phone)
3. **Customer Home Screen** - Big ice cream button, current location, request status
4. **Customer Map Screen** - Interactive candy-land style map showing ice cream truck location in real-time
5. **Order History Screen** - Past requests and completed orders
6. **Profile Screen** - Customer settings, preferences, payment info

### Driver Side
1. **Driver Auth Screen** - Login/Sign up for ice cream vendors
2. **Driver Dashboard** - Active alerts, incoming requests, earnings
3. **Driver Map Screen** - Map with customer request locations, navigation
4. **Driver Profile Screen** - Earnings, ratings, vehicle info, settings

---

## Primary Content and Functionality

### Customer Home Screen
- **Big Ice Cream Button** - Center of screen, large tap target (minimum 80pt), animated ice cream cone icon
- **Current Location Display** - Shows neighborhood/address
- **Request Status** - "Waiting for driver..." or "Driver arriving in X minutes"
- **Quick Stats** - Estimated arrival, distance to truck
- **Bottom Navigation** - Home, Map, History, Profile

### Customer Map Screen
- **Interactive Candy-Land Map** - Pastel colors, playful styling
- **Ice Cream Truck Emoji** - Animated truck moving along route
- **Request Markers** - Different ice cream cone emojis for different ice cream types
- **Real-time Updates** - Truck position updates every 5 seconds
- **Customer Location Pin** - Shows where request was placed

### Driver Dashboard
- **Incoming Requests** - List of customer requests with location, distance, estimated payout
- **Accept/Decline Buttons** - Quick action buttons for each request
- **Active Delivery** - Current customer being served with live map
- **Earnings Summary** - Daily/weekly earnings display
- **Bottom Navigation** - Dashboard, Map, History, Profile

### Driver Map Screen
- **Route Map** - Shows navigation to customer location
- **Customer Marker** - Highlighted location with address
- **Estimated Time** - ETA to customer
- **Navigation Controls** - Start navigation, call customer, complete delivery

---

## Key User Flows

### Customer Ordering Flow
1. Customer opens app → Home screen
2. Taps big ice cream button → Request sent to backend
3. Screen shows "Waiting for driver..."
4. Driver accepts request → Status updates to "Driver on the way"
5. Customer can view driver location on map
6. Driver arrives → Status updates, customer can rate/pay
7. Order complete

### Driver Accepting Flow
1. Driver opens app → Dashboard with incoming requests
2. Sees list of customer requests (location, distance, payout)
3. Taps "Accept" on a request
4. Map loads showing route to customer
5. Drives to location, completes delivery
6. Marks order complete, earns money

---

## Color Choices

### Primary Palette (Kid-Friendly & Playful)
- **Candy Pink** - #FF69B4 (primary accent, ice cream theme)
- **Mint Green** - #00D9A3 (secondary accent, fresh/cool)
- **Sunny Yellow** - #FFD700 (highlights, buttons)
- **Sky Blue** - #87CEEB (background, map sky)
- **Cream** - #FFF8DC (light backgrounds, cards)
- **Chocolate Brown** - #8B4513 (text, accents)

### Map Theme (Candy Land Style)
- **Pastel Pink** - #FFB6C1 (map background)
- **Pastel Blue** - #ADD8E6 (water/paths)
- **Pastel Green** - #90EE90 (grass/parks)
- **Pastel Yellow** - #FFFFE0 (highlights)

### Functional Colors
- **Success Green** - #22C55E (completed orders)
- **Warning Orange** - #FF8C00 (urgent alerts)
- **Error Red** - #FF6B6B (cancellations)

---

## Typography & Icons

- **Heading Font** - Rounded, playful (e.g., "Fredoka", "Nunito")
- **Body Font** - Clear, readable (e.g., "Inter", "Poppins")
- **Icons** - Emoji ice cream cones, trucks, location pins
- **Animations** - Subtle bounce on button press, smooth map transitions

---

## Layout Specifications

### Safe Area & Orientation
- **Portrait only** (9:16 aspect ratio)
- **One-handed usage** - All interactive elements within thumb reach
- **Safe area padding** - 16pt top/bottom, 12pt sides

### Component Sizing
- **Big Ice Cream Button** - 120pt diameter, center of screen
- **Tab Bar** - 56pt height + safe area bottom
- **Cards** - Full width with 12pt margins
- **Text** - 16pt body, 24pt headings, 14pt captions

---

## Accessibility & Performance

- **Contrast Ratios** - WCAG AA compliant (4.5:1 minimum)
- **Touch Targets** - Minimum 44pt for all interactive elements
- **Loading States** - Skeleton screens for map and request lists
- **Offline Handling** - Cache last known driver location

