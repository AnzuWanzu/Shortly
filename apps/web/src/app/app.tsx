import styles from './app.module.css';

export function App() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="shortly-heading">
        <span className={styles.logo} aria-hidden="true">
          🔗
        </span>
        <h1 id="shortly-heading">Shortly</h1>
        <p>Web foundation ready.</p>
      </section>
    </main>
  );
}

export default App;
