import Link from "next/link";

const prizeShapes = ["Rocket Keychain", "Mystery Capsule", "Champion Trophy"];

export default function PrizeShopPage() {
  return (
    <section className="prize-shop">
      <p className="eyebrow">TICKET EXCHANGE · COUNTER OPEN</p>
      <h1>Prize shop</h1>
      <p className="shop-intro">The shelves are being stocked. Keep earning tickets while the prizes arrive.</p>
      <div className="prize-shelf" aria-label="Coming soon prizes">
        {prizeShapes.map((prize, index) => (
          <div className="prize-placeholder" key={prize}>
            <span aria-hidden="true">{["✦", "?", "♛"][index]}</span>
            <p>{prize}</p>
            <small>COMING SOON</small>
          </div>
        ))}
      </div>
      <Link className="back-link" href="/">← Back to the arcade floor</Link>
    </section>
  );
}
