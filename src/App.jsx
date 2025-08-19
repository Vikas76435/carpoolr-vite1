import React, { useEffect, useMemo, useState } from "react";

const uid = () => Math.random().toString(36).slice(2);
const INR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);

const LS_KEYS = {
  RIDES: "carpoolr_rides",
  BOOKINGS: "carpoolr_bookings",
  USER: "carpoolr_user",
};

const seedRides = [
  { id: uid(), from: "Noida Sec 62", to: "Gurugram Cyberhub", date: todayISO(), time: "09:00", seats: 3, price: 180, driver: "Rohit", car: "WagonR" },
  { id: uid(), from: "Indirapuram", to: "Noida Sec 16", date: todayISO(), time: "09:30", seats: 2, price: 80, driver: "Sanya", car: "i20" },
  { id: uid(), from: "Greater Noida", to: "Noida Sec 62", date: todayISO(), time: "08:30", seats: 1, price: 130, driver: "Vikas", car: "Punch EV" },
];

function useLocalState(key, fallback) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

export default function App() {
  const [rides, setRides] = useLocalState(LS_KEYS.RIDES, []);
  const [bookings, setBookings] = useLocalState(LS_KEYS.BOOKINGS, []);
  const [user, setUser] = useLocalState(LS_KEYS.USER, { name: "Guest", phone: "" });
  const [tab, setTab] = useState("find");
  const [query, setQuery] = useState({ from: "", to: "", date: todayISO(), seats: 1 });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEYS.RIDES)) {
      setRides(seedRides);
    }
  }, []);

  const filtered = useMemo(() => {
    return rides.filter(r =>
      (!query.from || r.from.toLowerCase().includes(query.from.toLowerCase())) &&
      (!query.to || r.to.toLowerCase().includes(query.to.toLowerCase())) &&
      (!query.date || r.date === query.date) &&
      r.seats >= Number(query.seats || 1)
    );
  }, [rides, query]);

  const bookRide = (ride) => {
    if (!user?.name || !user?.phone) {
      setToast("⚠️ Pehele profile complete karein (name & phone).");
      setTab("profile"); return;
    }
    if (ride.seats <= 0) { setToast("⚠️ No seats left in this ride."); return; }
    const booking = { id: uid(), rideId: ride.id, rider: user.name, phone: user.phone, when: new Date().toISOString() };
    setBookings([booking, ...bookings]);
    setRides(rides.map(r => r.id === ride.id ? { ...r, seats: r.seats - 1 } : r));
    setToast("✅ Seat booked! Driver details sent to your phone.");
  };

  const cancelBooking = (b) => {
    const ride = rides.find(r=>r.id===b.rideId);
    if (ride) setRides(rides.map(r=> r.id===ride.id ? { ...r, seats: r.seats + 1 } : r));
    setBookings(bookings.filter(x=>x.id!==b.id));
    setToast("✅ Booking cancelled.");
  };

  return (
    <div style={{padding:20,fontFamily:"sans-serif"}}>
      <h1>🚗 CarPoolr</h1>
      <div style={{marginBottom:20}}>
        <button onClick={()=>setTab("find")}>Find Rides</button>{' '}
        <button onClick={()=>setTab("offer")}>Offer Ride</button>{' '}
        <button onClick={()=>setTab("bookings")}>My Bookings</button>{' '}
        <button onClick={()=>setTab("profile")}>Profile</button>
      </div>

      {tab==="find" && <div>
        <h2>Find Rides</h2>
        <input placeholder="From" value={query.from} onChange={e=>setQuery({...query,from:e.target.value})}/> {' '}
        <input placeholder="To" value={query.to} onChange={e=>setQuery({...query,to:e.target.value})}/> {' '}
        <input type="date" value={query.date} onChange={e=>setQuery({...query,date:e.target.value})}/> {' '}
        <input type="number" value={query.seats} onChange={e=>setQuery({...query,seats:e.target.value})}/> seats
        <ul>
          {filtered.map(r=>(
            <li key={r.id}>
              <b>{r.from} ➡ {r.to}</b> ({r.date} {r.time}) - {INR(r.price)} - Seats: {r.seats} - Driver: {r.driver}
              {' '}<button onClick={()=>bookRide(r)}>Book</button>
            </li>
          ))}
        </ul>
      </div>}

      {tab==="offer" && <div>
        <h2>Offer Ride</h2>
        <form onSubmit={(e)=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const ride=Object.fromEntries(fd.entries()); ride.id=uid(); ride.seats=Number(ride.seats||1); setRides([ride,...rides]); setToast("✅ Ride published!"); setTab("find"); e.currentTarget.reset();}}>
          <input name="from" placeholder="From" required/> <input name="to" placeholder="To" required/> <input name="date" type="date" required/> <input name="time" type="time" required/> <input name="seats" type="number" defaultValue={1}/> <input name="price" type="number" placeholder="Price"/> <button type="submit">Publish</button>
        </form>
      </div>}

      {tab==="bookings" && <div>
        <h2>My Bookings</h2>
        <ul>{bookings.map(b=>{const ride=rides.find(r=>r.id===b.rideId)||{}; return <li key={b.id}>{ride.from} ➡ {ride.to} on {ride.date} {ride.time} <button onClick={()=>cancelBooking(b)}>Cancel</button></li>;})}</ul>
      </div>}

      {tab==="profile" && <div>
        <h2>Profile</h2>
        <input placeholder="Name" value={user.name} onChange={e=>setUser({...user,name:e.target.value})}/> <input placeholder="Phone" value={user.phone} onChange={e=>setUser({...user,phone:e.target.value})}/>
      </div>}

      {toast && <div style={{marginTop:20,background:"#eee",padding:10}}>{toast}</div>}
    </div>
  );
}
