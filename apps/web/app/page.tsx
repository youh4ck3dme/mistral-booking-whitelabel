'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="page-loading active">
        <div className="page-loading-inner">
          <div className="page-spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Bookio - Moderny rezervacny system</title>
        <meta name="description" content="Rezervacny system, ktory mysli na vsetko. Venujte sa svojmu biznisu." />
      </Head>

      {/* Navbar */}
      <header className="navbar navbar-expand-lg fixed-top">
        <div className="container justify-content-md-between justify-content-end px-2">
          <a className="navbar-brand me-auto">
            <Image id="logo" src="/images/logo.svg" alt="Bookio Logo" width={120} height={40} />
          </a>
          
          <a id="loginbtn" className="btn btn-outline-primary bg-light btn-sm d-none d-md-inline-block">
            <i className="ai-user fs-xl me-2 ms-n1"></i>
            Prihlasit sa
          </a>
          
          <a id="topbtn" className="btn btn-primary btn-sm fs-sm ms-3 d-none d-md-inline-block">
            <i className="ai-arrow-right fs-xl me-2 ms-n1"></i>
            Vyskusat zdarma
          </a>

          <button className="navbar-toggler order-5 ms-2 my-1 d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <nav id="navbarNav" className="collapse navbar-collapse">
            <ul className="navbar-nav navbar-nav-scroll me-auto">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Funkcie
                </a>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#">Rezervacna kniha</a></li>
                  <li><a className="dropdown-item" href="#">Kalendar</a></li>
                  <li><a className="dropdown-item" href="#">Rezervacie 24/7</a></li>
                  <li><a className="dropdown-item" href="#">Pripomienky</a></li>
                  <li><a className="dropdown-item" href="#">Specialne udalosti</a></li>
                </ul>
              </li>
              
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Segmenty
                </a>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#">Krasa a Wellness</a></li>
                  <li><a className="dropdown-item" href="#">Kadernictva</a></li>
                  <li><a className="dropdown-item" href="#">Barberov</a></li>
                  <li><a className="dropdown-item" href="#">Wellness</a></li>
                  <li><a className="dropdown-item" href="#">Kozmeticke salony</a></li>
                  <li><a className="dropdown-item" href="#">Maserske salony</a></li>
                </ul>
              </li>
              
              <li className="nav-item">
                <a className="nav-link" href="#">Cennik</a>
              </li>
              
              <li className="nav-item">
                <a className="nav-link" href="#">Kontakt</a>
              </li>
            </ul>

            <div className="d-sm-none p-3 mt-n3 w-100">
              <a className="btn btn-outline-primary w-100 mb-1" href="#">
                Prihlasit sa
              </a>
              <a className="btn btn-primary w-100 mb-1" href="#">
                Vyskusat zdarma
              </a>
            </div>

            <ul className="nav align-items-center order-lg-3 lang-selector ms-auto">
              <li className="nav-item dropdown">
                <a id="langnav" className="nav-link dropdown-toggle ms-2 my-1" href="#" role="button" data-bs-toggle="dropdown">
                  SK
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#">Deutsch</a></li>
                  <li><a className="dropdown-item" href="#">English</a></li>
                  <li><a className="dropdown-item" href="#">Magyar</a></li>
                  <li><a className="dropdown-item" href="#">Polski</a></li>
                  <li><a className="dropdown-item" href="#">Slovencina</a></li>
                  <li><a className="dropdown-item" href="#">Cestina</a></li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bk-main px-2">
        <div className="container">
          <div className="bento">
            <div className="overlay">
              <h1 className="heading h1">Moderny rezervacny system pre salony, gastro a sluzby</h1>
              <div className="subheading">
                Venujte sa svojmu biznisu. A o rezervacie, spravu klientov a administratiu sa postara Bookio.
              </div>
              <div className="buttons">
                <a href="#" className="btn btn-primary btn-lg me-3">
                  Vyskusat zdarma
                </a>
              </div>
            </div>
            <div className="bg">
              <Image src="/images/hero-bg-1.svg" alt="Hero background" fill className="img-fill" />
            </div>
            <div className="bg-m">
              <Image src="/images/hero-bg-2.svg" alt="Hero background mobile" fill className="img-fill" />
            </div>
          </div>

          <div className="bento reduce">
            <div className="overlay"></div>
            <div className="bg welcome">
              <Image src="/images/welcome.svg" alt="Welcome" fill className="img-fill" />
            </div>
            <div className="bg-m">
              <Image src="/images/welcome-mobile.svg" alt="Welcome mobile" fill className="img-fill" />
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="px-2 pt-2 my-5 brands">
        <div className="container text-center">
          <div className="brands-grid">
            <Image src="/images/brands/brand1.svg" alt="Brand 1" width={120} height={40} className="brand-logo" />
            <Image src="/images/brands/brand2.svg" alt="Brand 2" width={120} height={40} className="brand-logo" />
            <Image src="/images/brands/brand3.svg" alt="Brand 3" width={120} height={40} className="brand-logo" />
            <Image src="/images/brands/brand4.svg" alt="Brand 4" width={120} height={40} className="brand-logo" />
            <Image src="/images/brands/brand5.svg" alt="Brand 5" width={120} height={40} className="brand-logo" />
            <Image src="/images/brands/brand6.svg" alt="Brand 6" width={120} height={40} className="brand-logo" />
          </div>
        </div>
      </section>

      {/* Main Value Proposition */}
      <section className="px-2 pt-2 my-5">
        <div className="container bk-alert pt-1 mb-0">
          <h2 className="h1 text-center pt-2 pt-sm-3">Menej chaosu. Viac klientov. Vyssie trzby.</h2>
          <p className="text-center pb-3 mb-3 mb-lg-4">Rezervacny system, ktory mysli na vsetko.</p>
          
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4">
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">💻</div>
                <h3>Rezervacie 24/7</h3>
                <p>Klienti sa objednavaju sami. Vecer, cez vikend, aj ked oddychujete.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">⏰</div>
                <h3>Usetrite 40 percenta casu</h3>
                <p>Menej telefonov, menej zrusenych terminov. Vy sa mozete su modulus na svoj biznis.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">📈</div>
                <h3>Vyssie trzby o 35 percent</h3>
                <p>Online rezervacie prinasia novych a modernych zakaznikov, ktore zaplatia vase sluzby.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">📊</div>
                <h3>Dokonaly prehlad</h3>
                <p>Ziskajte statistiky a perfektny prehlad o terminoch. Vzdy viete, co sa deje.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">⚡</div>
                <h3>Nastavene za par minut</h3>
                <p>Ziadne zlozite IT postupy. Intuitivne nastavenie, ktore zvlada kazdy.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">👥</div>
                <h3>Pritelsky tim ludi</h3>
                <p>Obratte sa na nasich specialista a zakaznicku podporu ked alebo potrebujete.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">🔔</div>
                <h3>Notifikacie a SMS pripomienky</h3>
                <p>Automaticke pripomienky, SMS a notifikacie pre vasich klientov.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">💳</div>
                <h3>Jednoduchsi predaj a platby</h3>
                <p>Zalhove platby, digitalne platby aj moznosti online platieb.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try Section */}
      <section className="px-2 pt-4 pb-3">
        <div className="container bk-alert bk-alert-primary">
          <div className="row">
            <div className="col-md-8 col-xl-8">
              <h2 className="h2">Vyskusajte si Bookio nezavazne</h2>
            </div>
            <div className="col-md-4 col-xl-4 text-end">
              <a href="#" className="text-decoration-none">
                Vyskusat zdarma -&gt;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Tabs */}
      <section className="border-top border-light px-2 py-2">
        <div className="container px-3 py-3 my-lg-3">
          <h2 className="h1 mb-4">Bookio vam pomaha v biznise vyhrat. Kazdy den.</h2>
          
          <div className="row pt-sm-2 pt-md-0 pt-xl-1">
            <div className="col-12">
              <ul className="nav nav-features nav-tabs pb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#funkcie">Funkcie</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#rezervacie">Rezervacie</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#marketing">Marketing</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#predaj">Predaj a platby</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#manazment">Manazment</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#api">API a Integracie</button>
                </li>
              </ul>
            </div>

            <div className="col-md-6 col-xl-5 offset-xl-1 order-3">
              <Image src="/images/features-screenshot.svg" alt="Features Screenshot" width={600} height={400} className="img-fluid rounded shadow-lg" />
            </div>

            <div className="col-md-6 order-md-1">
              <div className="tab-content pt-lg-2 pt-xl-3">
                <div className="tab-pane fade show active" id="funkcie">
                  <p>Funkcie, ktore sa riesia samy 24/7 a online. Novi zakaznici bez namahy. Zjednodusene procesy. Vyssie trzby.</p>
                </div>
                <div className="tab-pane fade" id="rezervacie">
                  <p>Rezervacie, ktore sa riesia samy 24/7 a online. Klienti sa objednavaju sami cez web alebo mobilnu aplikaciu.</p>
                </div>
                <div className="tab-pane fade" id="marketing">
                  <p>Marketingove naradie pre zvysovanie viditelnosti a ziskavanie novych klientov.</p>
                </div>
                <div className="tab-pane fade" id="predaj">
                  <p>Predajne a platobne riesenia pre jednoduchsie arychlejsie transakcie.</p>
                </div>
                <div className="tab-pane fade" id="manazment">
                  <p>Kompletne manazerske naradie pre spravu vasiej prevadzky, zamestnancov a klientov.</p>
                </div>
                <div className="tab-pane fade" id="api">
                  <p>API rozhranie a integracie pre propojenie s inymi systemami a sluzbami.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segments Section */}
      <section className="px-2 py-5">
        <div className="container segments bk-alert bk-alert-dark">
          <div className="text-center">
            <h2 className="h1 pt-2 pt-sm-4">10 plus rokov vyvoja. 100 plus dostupnych segmentov.</h2>
          </div>
          
          <div className="segments-grid">
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/beauty.svg" alt="Krasa a Wellness" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Krasa a Wellness</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/medicine.svg" alt="Medicina a Zdravie" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Medicina a Zdravie</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/restaurant.svg" alt="Restauracie a Gastro" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Restauracie a Gastro</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/sport.svg" alt="Sport a Fitness" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Sport a Fitness</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/car.svg" alt="Auto-moto" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Auto-moto</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/entertainment.svg" alt="Atrakcie a Zabava" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Atrakcie a Zabava</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/services.svg" alt="Sluzby a Poradenstvo" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Sluzby a Poradenstvo</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/education.svg" alt="Vzdelavanie" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Vzdelavanie</h3>
            </div>
            <div className="segment-card text-center p-4">
              <Image src="/images/segments/offices.svg" alt="Firmy a Kancelarie" width={300} height={200} className="img-fluid rounded mb-3" />
              <h3>Firmy a Kancelarie</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="px-2 pt-4 pb-3">
        <div className="container bk-alert bk-alert-primary">
          <div className="row">
            <div className="col-md-8 col-xl-8">
              <h2 className="h2">Dohodnite si online konzultaciu</h2>
            </div>
            <div className="col-md-4 col-xl-4 text-end">
              <a href="#" className="text-decoration-none">
                Bezplatna konzultacia -&gt;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container testimonials px-2 pb-5">
        <div className="justify-content-center pt-2 pt-sm-4 pb-4">
          <div className="text-center pt-2">
            <h2 className="h1 mb-1">Cisla hovoria jasne</h2>
          </div>

          <div className="row row-cols-2 row-cols-md-4 g-0">
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">20,000,000 plus</strong>
                  <span>obsluzenych zakaznikov</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">1,000,000 plus</strong>
                  <span>online platieb</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">15 plus</strong>
                  <span>odmakanych rokov</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">2,500 plus</strong>
                  <span>prevadzok</span>
                </div>
              </div>
            </div>
          </div>

          <div className="testimonials-grid">
            <div className="bk-alert testimonial p-40 d-flex">
              <div className="testimonial-content">
                <p>Zjednodusenie pracovneho chaosu. Bookio ma skvely tim ludi, Martina mi vzdy bola velmi napomocna.</p>
                <div className="testimonial-author">
                  <strong>Maria, Kadernictvo</strong>
                </div>
              </div>
            </div>
            
            <div className="bk-alert testimonial p-40 d-flex">
              <div className="testimonial-content">
                <p>S bookiom spolupracujeme uz pol roka a nemozeme si tento rezervacny system vynachvalit.</p>
                <div className="testimonial-author">
                  <strong>Jan, Wellness Centrum</strong>
                </div>
              </div>
            </div>
            
            <div className="bk-alert testimonial p-40 d-flex">
              <div className="testimonial-content">
                <p>Zaujme novych zakaznikov. Nasej klinike pomohol s objednavanim klientov a zabezpecenim plynuleho chodu.</p>
                <div className="testimonial-author">
                  <strong>Dr. Novak, Medicinske centrum</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="px-2 pb-5">
        <div className="bk-main np">
          <div className="container">
            <div className="bento">
              <div className="overlay">
                <p>Za Bookiom stoja technologie. Aj ludia. Aplikacia, ktora setri cas. Tim, ktory riesi vas problem.</p>
              </div>
              <div className="bg">
                <Image src="/images/team-bg-1.svg" alt="Team background" fill className="img-fill" />
              </div>
              <div className="bg-m">
                <Image src="/images/team-bg-2.svg" alt="Team background mobile" fill className="img-fill" />
              </div>
            </div>

            <div className="bento reduce-small">
              <div className="overlay"></div>
              <div className="bg">
                <Image src="/images/technology-bg.svg" alt="Technology" fill className="img-fill" />
              </div>
              <div className="bg-m"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Form Section */}
      <section id="konzult" className="position-relative px-2 pb-5 pt-2">
        <div className="container position-relative zindex-2 pt-sm-2">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <Image src="/images/consultation.svg" alt="Consultation" width={600} height={400} className="consult-bento img-fluid rounded" />
            </div>
            
            <div className="col-lg-6 consult-content">
              <h2 className="h1">Poradte sa sa s nasi mi specialis mi</h2>
              <ul className="mt-4 list-unstyled">
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Vyberte si preferovany termin konzultacie
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Ziskajte nezávisly pohlad od ludi z praxe
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Zorientujte sa v moznostiach Bookia
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Ziskajte informacie pre spravne rozhodnutie
                </li>
              </ul>
              <div className="mb-4">
                <a href="#" className="btn btn-primary btn-lg d-inline-flex">
                  Bezplatna konzultacia
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page-loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #fff;
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        
        .page-loading.active {
          display: flex;
        }
        
        .page-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0d6efd;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        
        .bento {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          margin-bottom: 2rem;
          min-height: 400px;
        }
        
        .bento.reduce {
          min-height: 200px;
        }
        
        .bento.reduce-small {
          min-height: 150px;
        }
        
        .bento .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: white;
          z-index: 2;
        }
        
        .bento .bg,
        .bento .bg-m {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .bento .bg-m {
          display: none;
        }
        
        .img-fill {
          object-fit: cover !important;
        }
        
        @media (max-width: 768px) {
          .bento .bg {
            display: none;
          }
          .bento .bg-m {
            display: block;
          }
          .bento {
            min-height: 300px;
          }
          .bento.reduce {
            min-height: 150px;
          }
        }
        
        .brand-logo {
          height: 40px;
          opacity: 0.7;
          filter: grayscale(100%);
          transition: all 0.3s ease;
        }
        
        .brand-logo:hover {
          opacity: 1;
          filter: grayscale(0%);
        }
        
        .brands-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 2rem;
          justify-items: center;
          align-items: center;
        }
        
        .bk-system {
          padding: 1.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .bk-system:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .bk-alert {
          background: rgba(13, 110, 253, 0.1);
          border-radius: 16px;
          padding: 2rem;
        }
        
        .bk-alert-primary {
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          color: white;
        }
        
        .bk-alert-dark {
          background: #212529;
          color: white;
        }
        
        .testimonial {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          min-height: 200px;
        }
        
        .testimonial-content {
          padding: 1.5rem;
        }
        
        .testimonial-author {
          margin-top: 1rem;
          color: #0d6efd;
          font-weight: 600;
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .segment-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        
        .segment-card:hover {
          transform: translateY(-5px);
        }
        
        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          justify-items: center;
        }
        
        .consult-bento {
          border-radius: 16px;
          width: 100%;
        }
        
        .consult-content {
          padding: 2rem;
        }
        
        .nav-features {
          border: none;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .nav-features .nav-link {
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          color: #495057;
          font-weight: 500;
        }
        
        .nav-features .nav-link.active,
        .nav-features .nav-link:hover {
          background: #0d6efd;
          color: white;
        }
        
        @media (max-width: 768px) {
          .text-end {
            text-align: center !important;
          }
          .consult-content {
            padding: 1.5rem;
          }
          .brands-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .segments-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
