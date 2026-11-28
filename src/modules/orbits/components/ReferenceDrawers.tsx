import React from 'react';

export const ReferenceDrawers: React.FC = () => {
  return (
    <section className="drawers-section" aria-label="Reference equations and research benchmarks">
      <details className="editorial-drawer">
        <summary>
          <span>The maths behind orbits and rockets (orbit speed, transfers, rocket equation)</span>
          <span className="drawer-chevron">Expand equations &amp; tables</span>
        </summary>
        <div className="drawer-body">
          <div className="equation-grid">
            <div className="equation-box">
              <div className="equation-title">How fast you must move to stay up (vis-viva equation)</div>
              <div className="equation-formula">v = sqrt(mu * (2/r - 1/a)), circular: v_c = sqrt(mu / r)</div>
              <p className="equation-note">
                With mu = 3.986004418 x 10^14 m^3/s^2 and R_E = 6,371 km: LEO at 550 km orbits at 7.59 km/s (~95.6 min), while GEO at 35,786 km slows to 3.07 km/s.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">Cheapest route between two orbits (Hohmann transfer delta-v)</div>
              <div className="equation-formula">
                dv1 = sqrt(mu/r1)*(sqrt(2*r2/(r1+r2)) - 1); dv2 = sqrt(mu/r2)*(1 - sqrt(2*r1/(r1+r2)))
              </div>
              <p className="equation-note">
                Minimum-energy two-burn elliptical transfer between circular orbits r1 and r2. LEO launch baseline adds 9.3-9.5 km/s for gravity and atmospheric drag losses.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">How much fuel a rocket needs (Tsiolkovsky rocket equation)</div>
              <div className="equation-formula">dv = I_sp * g0 * ln(m0 / mf) =&gt; Mass Fraction = 1 - exp(-dv / (I_sp * g0))</div>
              <p className="equation-note">
                In words: the faster you need to go, the more of the rocket must be fuel, and it grows exponentially. I_sp (specific impulse) is fuel efficiency in seconds. At 9.4 km/s to LEO with Methalox (350 s avg I_sp), m0/mf = 15.46 (&gt;93.5% propellant). Because tanks and engines weigh 5-8%, a single-stage rocket (SSTO) barely works, so Earth rockets use stages.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">Lasers between satellites vs fibre cables on the ground</div>
              <div className="equation-formula">c_vac = 299,792 km/s vs v_fiber = c / 1.468 = 204,218 km/s</div>
              <p className="equation-note">
                Vacuum laser cross-links (1,550 nm, 100-200 Gbps) travel 32% faster than silica glass fiber, cutting London-Tokyo latency by ~25-35 ms.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Propellant</th>
                  <th>Oxidizer / Fuel</th>
                  <th>Efficiency in space (Isp)</th>
                  <th>Efficiency at sea level (Isp)</th>
                  <th>Density (g/cm^3)</th>
                  <th>Engineering Trade-Off</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hydrolox</strong></td>
                  <td>LOX / LH2</td>
                  <td className="mono">450-453 s</td>
                  <td className="mono">360-380 s</td>
                  <td className="mono">0.36</td>
                  <td>Highest efficiency; giant tanks and severe boil-off</td>
                </tr>
                <tr>
                  <td><strong>Methalox</strong></td>
                  <td>LOX / CH4 (Raptor)</td>
                  <td className="mono">365-380 s</td>
                  <td className="mono">327-334 s</td>
                  <td className="mono">0.83</td>
                  <td>Clean reuse (no coking), compact tanks, Mars ISRU</td>
                </tr>
                <tr>
                  <td><strong>Kerolox</strong></td>
                  <td>LOX / RP-1 (Merlin)</td>
                  <td className="mono">311-348 s</td>
                  <td className="mono">282-300 s</td>
                  <td className="mono">1.02</td>
                  <td>Dense propellant; soot requires refurbishment</td>
                </tr>
                <tr>
                  <td><strong>Solid Motor</strong></td>
                  <td>APCP</td>
                  <td className="mono">260-280 s</td>
                  <td className="mono">240-250 s</td>
                  <td className="mono">1.75</td>
                  <td>Instant thrust; zero throttling or shutdown</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className="editorial-drawer">
        <summary>
          <span>The maths behind the radio link (signal loss, speed limit, error correction)</span>
          <span className="drawer-chevron">Expand equations &amp; tables</span>
        </summary>
        <div className="drawer-body">
          <div className="equation-grid">
            <div className="equation-box">
              <div className="equation-title">Signal lost to distance (free-space path loss, FSPL)</div>
              <div className="equation-formula">FSPL(dB) = 20*log10(d_km) + 20*log10(f_GHz) + 92.45</div>
              <p className="equation-note">
                Path loss grows by 6 dB every time distance or carrier frequency doubles. Higher bands require narrower, higher-gain pencil beams to close the link.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">The top speed any link can reach (Shannon-Hartley limit)</div>
              <div className="equation-formula">C = B * log2(1 + SNR), N = k_B * T_sys * B</div>
              <p className="equation-note">
                SNR is signal strength divided by background noise. Data rate scales linearly with channel bandwidth B and logarithmically with SNR. Modern 5G NR and DVB-S2X satellite links use LDPC codes to operate near this limit.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">Flat antennas that aim without moving (phased-array beam steering)</div>
              <div className="equation-formula">delta_phi_n = (2*pi*d / lambda) * sin(theta)</div>
              <p className="equation-note">
                Flat user terminals combine 1,000+ patch elements to steer wavefronts in sub-microseconds, tracking LEO passes (3-5 min) with no moving motors.
              </p>
            </div>

            <div className="equation-box">
              <div className="equation-title">Extra bits that fix transmission errors (error-correcting codes)</div>
              <div className="equation-formula">Hamming: floor((d - 1)/2) bits | LDPC: sparse graph decoding</div>
              <p className="equation-note">
                Hamming protects ECC memory; LDPC powers 5G NR, Wi-Fi 6/7, and satellite links; rateless Fountain codes rebuild files over lossy multicast links.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>System / Band</th>
                  <th>Carrier</th>
                  <th>Channel width (bandwidth)</th>
                  <th>Typical speed</th>
                  <th>Propagation &amp; Latency Character</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>4G LTE</strong></td>
                  <td className="mono">1.8 GHz</td>
                  <td className="mono">20 MHz</td>
                  <td className="mono">10-150 Mbps</td>
                  <td>1 ms subframes; 20-50 ms end-to-end latency</td>
                </tr>
                <tr>
                  <td><strong>5G NR sub-6</strong></td>
                  <td className="mono">3.5 GHz</td>
                  <td className="mono">100 MHz</td>
                  <td className="mono">0.1-2 Gbps</td>
                  <td>0.125 ms mini-slots; 10-30 ms end-to-end</td>
                </tr>
                <tr>
                  <td><strong>Wi-Fi 6 (802.11ax)</strong></td>
                  <td className="mono">5 GHz</td>
                  <td className="mono">80 MHz</td>
                  <td className="mono">600 Mbps/stream</td>
                  <td>980 OFDM data subcarriers, 1024-QAM</td>
                </tr>
                <tr>
                  <td><strong>Starlink Ku Downlink</strong></td>
                  <td className="mono">10.7-12.7 GHz</td>
                  <td className="mono">240 MHz</td>
                  <td className="mono">100-200 Mbps/user</td>
                  <td>LEO 550 km; ~4 ms one-way; moderate rain fade</td>
                </tr>
                <tr>
                  <td><strong>Ka-band HTS / Gateway</strong></td>
                  <td className="mono">26.5-40 GHz</td>
                  <td className="mono">500+ MHz</td>
                  <td className="mono">1-10+ Gbps</td>
                  <td>High capacity pencil beams; strong rain fade</td>
                </tr>
                <tr>
                  <td><strong>Single-Mode Fiber</strong></td>
                  <td className="mono">193 THz (1550 nm)</td>
                  <td className="mono">~10 THz (C+L)</td>
                  <td className="mono">40-100 Tbps</td>
                  <td>Guided in glass (n = 1.468); immune to weather</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
};
