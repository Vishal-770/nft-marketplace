"use client";

import { useGSAP } from "@gsap/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { redirect } from "next/navigation";
import { useMemo, useRef } from "react";
import * as THREE from "three";

gsap.registerPlugin(SplitText);

interface ShaderPlaneProps {
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: { value: unknown } };
}

function ShaderPlane({
  vertexShader,
  fragmentShader,
  uniforms,
}: ShaderPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
      material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

interface ShaderBackgroundProps {
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: { [key: string]: { value: unknown } };
  className?: string;
}

function ShaderBackground({
  vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
    gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader = `
    precision highp float;

    varying vec2 vUv;
    uniform float u_time;
    uniform vec3 u_resolution;
    uniform sampler2D iChannel0;

    #define STEP 256
    #define EPS .001

    float smin( float a, float b, float k )
    {
        float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
        return mix( b, a, h ) - k*h*(1.0-h);
    }

    const mat2 m = mat2(.8,.6,-.6,.8);

    float noise( in vec2 x )
    {
      return sin(1.5*x.x)*sin(1.5*x.y);
    }

    float fbm6( vec2 p )
    {
        float f = 0.0;
        f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
        f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
        f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
        f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
        //f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;
        f += 0.015625*(0.5+0.5*noise( p ));
        return f/0.96875;
    }


    mat2 getRot(float a)
    {
        float sa = sin(a), ca = cos(a);
        return mat2(ca,-sa,sa,ca);
    }


    vec3 _position;

    float sphere(vec3 center, float radius)
    {
        return distance(_position,center) - radius;
    }

    float swingPlane(float height)
    {
        vec3 pos = _position + vec3(0.,0.,u_time * 7.0);
        float def =  fbm6(pos.xz * .35) * 0.8;
        
        float way = pow(abs(pos.x) * 25. ,2.2) *.000025;
        def *= way;
        
        float ch = height + def;
        return max(pos.y - ch,0.);
    }

    float map(vec3 pos)
    {
        _position = pos;
        
        float dist;
        dist = swingPlane(0.);
        
        float sminFactor = 5.25;
        dist = smin(dist,sphere(vec3(0.,-15.,80.),60.),sminFactor);
        return dist;
    }


    vec3 getNormal(vec3 pos)
    {
        vec3 nor = vec3(0.);
        vec3 vv = vec3(0.,1.,-1.)*.01;
        nor.x = map(pos + vv.zxx) - map(pos + vv.yxx);
        nor.y = map(pos + vv.xzx) - map(pos + vv.xyx);
        nor.z = map(pos + vv.xxz) - map(pos + vv.xxy);
        nor /= 2.;
        return normalize(nor);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = (fragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
        
        vec3 rayOrigin = vec3(uv + vec2(0.,6.), -1. );
        
        vec3 rayDir = normalize(vec3(uv , 1.));
        
        rayDir.zy = getRot(.15) * rayDir.zy;
        
        vec3 position = rayOrigin;
        
        
        float curDist;
        int nbStep = 0;
        
        for(; nbStep < STEP;++nbStep)
        {
            curDist = map(position + (texture(iChannel0, position.xz) - .5).xyz * .005);
            
            if(curDist < EPS)
                break;
            position += rayDir * curDist * .5;
        }
        
        float f;
                
        float dist = distance(rayOrigin,position);
        f = dist /(98.);
        f = float(nbStep) / float(STEP);
        
        // Create a more visible, higher contrast effect
        f *= 1.0;
        f = smoothstep(0.0, 1.0, f);
        f = pow(f, 0.3); // Increase contrast even more
        
        // Add some blue-purple tint for NFT theme with higher contrast
        vec3 baseColor = vec3(0.5, 1, 1.2);
        vec3 darkColor = vec3(0.1, 0.1, 0.1);
        vec3 col = mix(darkColor, baseColor, f);
        
        // Add more variation and movement
        col += sin(uv.x * 6.0 + u_time * 0.6) * 0.25;
        col += cos(uv.y * 5.0 + u_time * 1.0) * 0.2;
        col *= 1.0; // Increase overall intensity
                
        fragColor = vec4(col, 0.9);
    }
    void main() {
      vec4 fragColor;
      vec2 fragCoord = vUv * u_resolution.xy;
      mainImage(fragColor, fragCoord);
      gl_FragColor = fragColor;
    }
  `,
  uniforms = {},
  className = "w-full h-full",
}: ShaderBackgroundProps) {
  const shaderUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector3(1, 1, 1) },
      ...uniforms,
    }),
    [uniforms]
  );

  return (
    <div className={className}>
      <Canvas className={className}>
        <ShaderPlane
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={shaderUniforms}
        />
      </Canvas>
    </div>
  );
}

export default function InfiniteHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const ctas = ctaRef.current ? Array.from(ctaRef.current.children) : [];

      const h1Split = new SplitText(h1Ref.current, { type: "lines" });
      const pSplit = new SplitText(pRef.current, { type: "lines" });

      gsap.set(bgRef.current, { filter: "blur(28px)" });
      gsap.set(h1Split.lines, {
        opacity: 0,
        y: 24,
        filter: "blur(8px)",
      });
      gsap.set(pSplit.lines, {
        opacity: 0,
        y: 16,
        filter: "blur(6px)",
      });
      if (ctas.length) gsap.set(ctas, { opacity: 0, y: 16 });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.to(bgRef.current, { filter: "blur(0px)", duration: 1.2 }, 0)
        .to(
          h1Split.lines,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            stagger: 0.1,
          },
          0.3
        )
        .to(
          pSplit.lines,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.6,
            stagger: 0.08,
          },
          "-=0.3"
        )
        .to(ctas, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.2");

      return () => {
        h1Split.revert();
        pSplit.revert();
      };
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className="relative h-svh w-full overflow-hidden overflow-x-hidden bg-background text-foreground"
    >
      <div className="absolute inset-0" ref={bgRef}>
        <ShaderBackground className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_40%,_hsl(var(--background))_100%)]" />

      <div className="relative z-10 flex h-svh w-full items-center justify-center px-6">
        <div className="text-center">
          <h1
            ref={h1Ref}
            className="mx-auto max-w-2xl lg:max-w-4xl text-[clamp(2.25rem,6vw,4rem)] font-extralight leading-[0.95] tracking-tight text-foreground"
          >
            Rent. Experience. Return.
            <br />
            <span className="text-primary">NFTs Reimagined.</span>
          </h1>
          <p
            ref={pRef}
            className="mx-auto mt-4 max-w-2xl md:text-balance text-sm/6 md:text-base/7 font-light tracking-tight text-muted-foreground"
          >
            Experience premium NFTs without the commitment. Rent exclusive
            digital assets for gaming, social media, and metaverse experiences.
            Access the impossible, affordably.
          </p>

          <div
            ref={ctaRef}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => {
                redirect("/home");
              }}
              className="group relative overflow-hidden border border-primary/30 bg-primary/40 hover:bg-primary/60 px-6 py-3 text-sm rounded-lg font-medium tracking-wide text-primary-foreground backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
            >
              Start Renting
            </button>

            <button
              type="button"
              onClick={() => {
                redirect("/home/marketplace");
              }}
              className="group relative px-6 py-3 text-sm font-medium tracking-wide  border border-border hover:border-primary/50 rounded-lg transition-all duration-500 hover:text-foreground hover:bg-accent/50 bg-accent/10 cursor-pointer"
            >
              Browse Collection
            </button>
          </div>

          {/* Stats Section */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-xs text-muted-foreground tracking-wide">
                NFTs Available
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-xs text-muted-foreground tracking-wide">
                Active Renters
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">50 ETH</div>
              <div className="text-xs text-muted-foreground tracking-wide">
                Volume Traded
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
