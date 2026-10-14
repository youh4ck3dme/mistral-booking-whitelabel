'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
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
        <title>Bookio - Moderný rezervačný systém</title>
        <meta name="description" content="Rezervačný systém, ktorý myslí na všetko. Venujte sa svojmu biznisu." />
      </Head>

      {/* Navbar */}
      <header className="navbar navbar-expand-lg fixed-top">
        <div className="container justify-content-md-between justify-content-end px-2">
          <a className="navbar-brand me-auto">
            <img id="logo" src="/images/logo.png" alt="Bookio Logo" width="120" height="40" />
          </a>
          
          <a id="loginbtn" className="btn btn-outline-primary bg-light btn-sm d-none d-md-inline-block">
            <i className="ai-user fs-xl me-2 ms-n1"></i>
            Prihlásiť sa
          </a>
          
          <a id="topbtn" className="btn btn-primary btn-sm fs-sm ms-3 d-none d-md-inline-block">
            <i className="ai-arrow-right fs-xl me-2 ms-n1"></i>
            Vyskúšať zdarma
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
                  <li><a className="dropdown-item" href="#">Rezervačná kniha</a></li>
                  <li><a className="dropdown-item" href="#">Kalendár</a></li>
                  <li><a className="dropdown-item" href="#">Rezervácie 24/7</a></li>
                  <li><a className="dropdown-item" href="#">Pripomienky</a></li>
                  <li><a className="dropdown-item" href="#">Špeciálne udalosti</a></li>
                </ul>
              </li>
              
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Segmenty
                </a>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#">Krása a Wellness</a></li>
                  <li><a className="dropdown-item" href="#">Kaderníctva</a></li>
                  <li><a className="dropdown-item" href="#">Barberov</a></li>
                  <li><a className="dropdown-item" href="#">Wellness</a></li>
                  <li><a className="dropdown-item" href="#">Kozmetické salóny</a></li>
                  <li><a className="dropdown-item" href="#">Masérske salóny</a></li>
                </ul>
              </li>
              
              <li className="nav-item">
                <a className="nav-link" href="#">Cenník</a>
              </li>
              
              <li className="nav-item">
                <a className="nav-link" href="#">Kontakt</a>
              </li>
            </ul>

            <div className="d-sm-none p-3 mt-n3 w-100">
              <a className="btn btn-outline-primary w-100 mb-1" href="#">
                Prihlásiť sa
              </a>
              <a className="btn btn-primary w-100 mb-1" href="#">
                Vyskúšať zdarma
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
                  <li><a className="dropdown-item" href="#">Slovenčina</a></li>
                  <li><a className="dropdown-item" href="#">Čeština</a></li>
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
              <h1 className="heading h1">Moderný rezervačný systém pre salóny, gastro a služby</h1>
              <div className="subheading">
                Venujte sa svojmu biznisu. A o rezervácie, správu klientov a administráciu sa postará Bookio.
              </div>
              <div className="buttons">
                <a href="#" className="btn btn-primary btn-lg me-3">
                  Vyskúšať zdarma
                </a>
              </div>
            </div>
            <div className="bg">
              <img src="/images/hero-bg-1.jpg" alt="Hero background" />
            </div>
            <div className="bg-m">
              <img src="/images/hero-bg-2.jpg" alt="Hero background mobile" />
            </div>
          </div>

          <div className="bento reduce">
            <div className="overlay"></div>
            <div className="bg welcome">
              <img src="/images/welcome.jpg" alt="Welcome" />
            </div>
            <div className="bg-m">
              <img src="/images/welcome-mobile.jpg" alt="Welcome mobile" />
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="px-2 pt-2 my-5 brands">
        <div className="container text-center">
          <Swiper
            slidesPerView={2}
            spaceBetween={30}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            breakpoints={{
              576: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              992: { slidesPerView: 5 },
              1200: { slidesPerView: 6 }
            }}
            className="pb-3 pb-sm-4 mb-xl-2"
          >
            <SwiperSlide>
              <img src="/images/brands/brand1.png" alt="Brand 1" className="brand-logo" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/images/brands/brand2.png" alt="Brand 2" className="brand-logo" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/images/brands/brand3.png" alt="Brand 3" className="brand-logo" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/images/brands/brand4.png" alt="Brand 4" className="brand-logo" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/images/brands/brand5.png" alt="Brand 5" className="brand-logo" />
            </SwiperSlide>
            <SwiperSlide>
              <img src="/images/brands/brand6.png" alt="Brand 6" className="brand-logo" />
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      {/* Main Value Proposition */}
      <section className="px-2 pt-2 my-5">
        <div className="container bk-alert pt-1 mb-0">
          <h2 className="h1 text-center pt-2 pt-sm-3">Menej chaosu. Viac klientov. Vyššie tržby.</h2>
          <p className="text-center pb-3 mb-3 mb-lg-4">Rezervačný systém, ktorý myslí na všetko.</p>
          
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4">
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">💻</div>
                <h3>Rezervácie 24/7</h3>
                <p>Klienti sa objednávajú sami. Večer, cez víkend, aj keď oddychujete.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">⏰</div>
                <h3>Ušetrite 40% času</h3>
                <p>Menej telefonátov, menej zrušených termínov. Vy sa môžete sústrediť na svoj biznis.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">📈</div>
                <h3>Vyššie tržby o 35%</h3>
                <p>Online rezervácie prinášajú nových a moderných zákazníkov, ktoré zaplakia vaše služby.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">📊</div>
                <h3>Dokonalý prehľad</h3>
                <p>Získajte štatistiky a perfektný prehľad o termínoch. Vždy viete, čo sa deje.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">⚡</div>
                <h3>Nastavené za pár minút</h3>
                <p>Žiadne zložité IT postupy. Intuitívne nastavenie, ktoré zvládne každý.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">👥</div>
                <h3>Priateľský tím ľudí</h3>
                <p>Obráťte sa na našich špecialistov a zákaznícku podporu ked' alebo potrebujete.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">🔔</div>
                <h3>Notifikácie a SMS pripomienky</h3>
                <p>Automatické pripomienky, SMS a notifikácie pre vašich klientov.</p>
              </div>
            </div>
            
            <div className="col">
              <div className="bk-system text-center">
                <div className="feature-icon">💳</div>
                <h3>Jednoduchší predaj a platby</h3>
                <p>Zálohové platby, digitálne platby aj možnosti online platieb.</p>
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
              <h2 className="h2">Vyskúšajte si Bookio nezáväzne</h2>
            </div>
            <div className="col-md-4 col-xl-4 text-right">
              <a href="#" className="text-decoration-none">
                Vyskúšať zdarma →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Tabs */}
      <section className="border-top border-light px-2 py-2">
        <div className="container px-3 py-3 my-lg-3">
          <h2 className="h1 mb-4">Bookio vám pomáha v biznise vyhrať. Každý deň.</h2>
          
          <div className="row pt-sm-2 pt-md-0 pt-xl-1">
            <div className="col-12">
              <ul className="nav nav-features nav-tabs pb-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#funkcie">Funkcie</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#rezervacie">Rezervácie</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#marketing">Marketing</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#predaj">Predaj a platby</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#manazment">Manažment</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" data-bs-toggle="tab" data-bs-target="#api">API a Integrácie</button>
                </li>
              </ul>
            </div>

            <div className="col-md-6 col-xl-5 offset-xl-1 order-3">
              <img src="/images/features-screenshot.png" alt="Features Screenshot" className="img-fluid rounded shadow-lg" />
            </div>

            <div className="col-md-6 order-md-1">
              <div className="tab-content pt-lg-2 pt-xl-3">
                <div className="tab-pane fade show active" id="funkcie">
                  <p>Funkcie, ktoré sa riešia samy 24/7 a online. Noví zákazníci bez námahy. Zjednodušené procesy. Vyššie tržby.</p>
                </div>
                <div className="tab-pane fade" id="rezervacie">
                  <p>Rezervácie, ktoré sa riešia samy 24/7 a online. Klienti sa objednávajú sami cez web alebo mobilnú aplikáciu.</p>
                </div>
                <div className="tab-pane fade" id="marketing">
                  <p>Marketingové nástroje pre zvyšovanie viditel'nosti a získavanie nových klientov.</p>
                </div>
                <div className="tab-pane fade" id="predaj">
                  <p>Predajné a platobné riešenia pre jednoduchšie a rýchlejšie transakcie.</p>
                </div>
                <div className="tab-pane fade" id="manazment">
                  <p>Kompletné manažérske nástroje pre správu vašej prevádzky, zamestnancov a klientov.</p>
                </div>
                <div className="tab-pane fade" id="api">
                  <p>API rozhranie a integrácie pre propojenie s inými systémami a službami.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segments Section */}
      <section className="px-2 py-5 swiper-overflow-clip">
        <div className="container segments bk-alert bk-alert-dark">
          <div className="text-center">
            <h2 className="h1 pt-2 pt-sm-4">10+ rokov vývoja. 100+ dostupných segmentov.</h2>
          </div>
          
          <Swiper
            modules={[Pagination, Navigation]}
            slidesPerView={1}
            spaceBetween={30}
            loop={true}
            pagination={{ clickable: true }}
            navigation={true}
            breakpoints={{
              576: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              992: { slidesPerView: 4 },
              1200: { slidesPerView: 5 }
            }}
            className="swiper-overflow pb-3 pb-sm-4"
          >
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/beauty.jpg" alt="Krása a Wellness" className="img-fluid rounded mb-3" />
                <h3>Krása a Wellness</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/medicine.jpg" alt="Medicína a Zdravie" className="img-fluid rounded mb-3" />
                <h3>Medicína a Zdravie</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/restaurant.jpg" alt="Reštaurácie a Gastro" className="img-fluid rounded mb-3" />
                <h3>Reštaurácie a Gastro</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/sport.jpg" alt="Šport a Fitness" className="img-fluid rounded mb-3" />
                <h3>Šport a Fitness</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/car.jpg" alt="Auto-moto" className="img-fluid rounded mb-3" />
                <h3>Auto-moto</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/entertainment.jpg" alt="Atrakcie a Zábava" className="img-fluid rounded mb-3" />
                <h3>Atrakcie a Zábava</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/services.jpg" alt="Služby a Poradenstvo" className="img-fluid rounded mb-3" />
                <h3>Služby a Poradenstvo</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/education.jpg" alt="Vzdelávanie" className="img-fluid rounded mb-3" />
                <h3>Vzdelávanie</h3>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="segment-card text-center p-4">
                <img src="/images/segments/offices.jpg" alt="Firmy a Kancelárie" className="img-fluid rounded mb-3" />
                <h3>Firmy a Kancelárie</h3>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      {/* Consultation Section */}
      <section className="px-2 pt-4 pb-3">
        <div className="container bk-alert bk-alert-primary">
          <div className="row">
            <div className="col-md-8 col-xl-8">
              <h2 className="h2">Dohodnite si online konzultáciu</h2>
            </div>
            <div className="col-md-4 col-xl-4 text-right">
              <a href="#" className="text-decoration-none">
                Bezplatná konzultácia →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container testimonials px-2 pb-5">
        <div className="justify-content-center pt-2 pt-sm-4 pb-4">
          <div className="text-center pt-2">
            <h2 className="h1 mb-1">Čísla hovoria jasne</h2>
          </div>

          <div className="row row-cols-2 row-cols-md-4 g-0">
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">20,000,000+</strong>
                  <span>obslúžených zákazníkov</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">1,000,000+</strong>
                  <span>online platieb</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">15+</strong>
                  <span>odmakaných rokov</span>
                </div>
              </div>
            </div>
            <div className="col d-md-flex justify-content-center text-center">
              <div className="position-absolute top-50 end-0 translate-middle-y">
                <div className="p-3 px-sm-0 py-sm-4">
                  <strong className="d-block text-lg">2,500+</strong>
                  <span>prevádzok</span>
                </div>
              </div>
            </div>
          </div>

          <Swiper
            modules={[Pagination, Navigation, Autoplay]}
            slidesPerView={1}
            spaceBetween={30}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={true}
            breakpoints={{
              768: { slidesPerView: 2 },
              992: { slidesPerView: 3 }
            }}
            className="pb-2 pt-4"
          >
            <SwiperSlide>
              <div className="bk-alert testimonial p-40 d-flex">
                <div className="testimonial-content">
                  <p>"Zjednodušenie pracovného chaosu" Bookio má skvelý tím ľudí, Martina mi vždy bola vel'mi nápomocná.</p>
                  <div className="testimonial-author">
                    <strong>Mária, Kaderníctvo</strong>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="bk-alert testimonial p-40 d-flex">
                <div className="testimonial-content">
                  <p>S bookiom spolupracujeme už pol roka a nemôžeme si tento rezervačný systém vynachváliť.</p>
                  <div className="testimonial-author">
                    <strong>Ján, Wellness Centrum</strong>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="bk-alert testimonial p-40 d-flex">
                <div className="testimonial-content">
                  <p>"Zaujme nových zákazníkov" Našej klinike pomohol s objednávaním klientov a zabezpečením plynulého chodu.</p>
                  <div className="testimonial-author">
                    <strong>Dr. Novák, Medicínske centrum</strong>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="bk-alert testimonial p-40 d-flex">
                <div className="testimonial-content">
                  <p>"Najefektívnejší systém na trhu" Rezervačný systém Bookio prináša nášmu klientovi úsporu času a peniaz.</p>
                  <div className="testimonial-author">
                    <strong>Peter, Fitness Centrum</strong>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            
            <SwiperSlide>
              <div className="bk-alert testimonial p-40 d-flex">
                <div className="testimonial-content">
                  <p>"Môj servis neprichádza o peniaze" Bookio ma prekvapilo v tom, že šetrí náš čas.</p>
                  <div className="testimonial-author">
                    <strong>Ludia, Auto servis</strong>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          <div className="swiper-controls mt-5">
            <button id="prev-testimonial" className="swiper-nav me-3">
              <i className="ai-arrow-left"></i>
            </button>
            <div className="swiper-pagination position-relative d-inline-block"></div>
            <button id="next-testimonial" className="swiper-nav ms-3">
              <i className="ai-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="px-2 pb-5">
        <div className="bk-main np">
          <div className="container">
            <div className="bento">
              <div className="overlay">
                <p>Za Bookiom stoja technológie. Aj ľudia. Aplikácia, ktorá šetrí čas. Tím, ktorý rieši váš problém.</p>
              </div>
              <div className="bg">
                <img src="/images/team-bg-1.jpg" alt="Team background" />
              </div>
              <div className="bg-m">
                <img src="/images/team-bg-2.jpg" alt="Team background mobile" />
              </div>
            </div>

            <div className="bento reduce-small">
              <div className="overlay"></div>
              <div className="bg">
                <img src="/images/technology-bg.jpg" alt="Technology" />
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
              <img src="/images/consultation.jpg" alt="Consultation" className="consult-bento img-fluid rounded" />
            </div>
            
            <div className="col-lg-6 consult-content">
              <h2 className="h1">Poraďte sa sa s našimi špecialistami</h2>
              <ul className="mt-4 list-unstyled">
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Vyberte si preferovaný termín konzultácie
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Získajte nezávislý pohľad od ľudí z praxe
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Zorientujte sa v možnostiach Bookia
                </li>
                <li className="mb-3">
                  <i className="ai-star-filled me-2"></i>
                  Získajte informácie pre správne rozhodnutie
                </li>
              </ul>
              <div className="mb-4">
                <a href="#" className="btn btn-primary btn-lg d-inline-flex">
                  Bezplatná konzultácia
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
          display: flex;
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
        }
        
        .bento.reduce {
          height: 200px;
        }
        
        .bento.reduce-small {
          height: 150px;
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
          object-fit: cover;
        }
        
        .bento .bg-m {
          display: none;
        }
        
        @media (max-width: 768px) {
          .bento .bg {
            display: none;
          }
          .bento .bg-m {
            display: block;
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
        
        .segment-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        
        .segment-card:hover {
          transform: translateY(-5px);
        }
        
        .segment-card img {
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
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
        
        .swiper-nav {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .swiper-pagination {
          position: static;
          margin-top: 0;
        }
        
        .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #ccc;
          opacity: 1;
        }
        
        .swiper-pagination-bullet-active {
          background: #0d6efd;
        }
        
        @media (max-width: 768px) {
          .text-right {
            text-align: center !important;
          }
          .consult-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
