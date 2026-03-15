import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "저작권 보호 및 법적 고지 — 네온즈(Neons)",
  description:
    "네온즈(Neons) 서비스의 지식재산권 보호, 무단 크롤링 금지 및 법적 고지 사항",
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_50%_20%,rgba(239,68,68,0.08),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-red-300"
        >
          &larr; 네온즈로 돌아가기
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-50">
          저작권 보호 및 법적 고지
        </h1>
        <p className="mb-4 text-sm text-zinc-500">
          최종 수정일: 2026년 3월 10일 &middot; 시행일: 2026년 3월 10일
        </p>
        <p className="mb-10 text-xs leading-relaxed text-zinc-400">
          본 문서는 &lsquo;네온즈(Neons)&rsquo;(이하 &ldquo;서비스&rdquo;) 웹사이트 및
          관련 시스템 일체에 대한 지식재산권 귀속, 이용 제한, 무단 크롤링 금지 및
          위반 시 법적 조치에 관한 사항을 규정합니다. 본 서비스에 접속하거나
          이용하는 것은 아래 약관에 동의하는 것으로 간주됩니다.
        </p>

        <article className="space-y-10 text-sm leading-relaxed text-zinc-300">
          {/* ── 제1조 ── */}
          <Section title="제1조 (지식재산권의 귀속)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                본 서비스의 <Strong>프론트엔드 및 백엔드 소스 코드</Strong>,{" "}
                <Strong>시각적 UI/UX 디자인</Strong>(네온·사이버펑크 콘셉트의
                레이아웃, 색상 체계, 타이포그래피, 애니메이션 효과, 아이콘 및 그래픽
                에셋 일체),{" "}
                <Strong>
                  4인 AI 판결 시스템의 프롬프트 로직·알고리즘·시스템 아키텍처
                </Strong>
                , 그리고 서비스 내에서 생성된{" "}
                <Strong>AI 판결 결과물 데이터</Strong>에 대한 저작권, 영업비밀,
                디자인권 등 일체의 지식재산권은 서비스 제작자(이하
                &ldquo;권리자&rdquo;)에게 귀속됩니다.
              </li>
              <li>
                본 서비스에 포함된 &lsquo;네온즈(Neons)&rsquo; 명칭, 로고, 서비스마크,
                캐릭터(AI 판사 페르소나 포함)는 권리자의 상표 또는 서비스표로서
                보호됩니다.
              </li>
              <li>
                4명의 AI 판사 시스템(Justice Zero, Heart Beat, Cyber Rekka,
                Detective Neon)의 페르소나 설정, 판결 방식, 프롬프트 구조 및
                합의 도출 알고리즘은 권리자의 핵심 영업비밀에 해당하며,{" "}
                <Strong>부정경쟁방지 및 영업비밀보호에 관한 법률</Strong>에 의해
                보호됩니다.
              </li>
              <li>
                이용자가 서비스를 통해 입력한 고민 내용에 대한 권리는 이용자에게
                귀속되나, 이를 기반으로 AI 시스템이 생성한 판결 결과물(판결문,
                분석 데이터, 투표 통계 등)에 대한 권리는 권리자에게 귀속됩니다.
              </li>
            </ol>
          </Section>

          {/* ── 제2조 ── */}
          <Section title="제2조 (무단 사용의 금지)">
            <p className="mb-3">
              서비스 이용자를 포함한 모든 제3자는 권리자의 사전 서면 동의 없이
              다음 각 호의 행위를 하여서는 안 됩니다.
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                본 서비스의 소스 코드, UI/UX 디자인, AI 프롬프트 로직의 전부 또는
                일부를 <Strong>복제·배포·전시·전송·공중송신</Strong>하는 행위
              </li>
              <li>
                본 서비스의 디자인 콘셉트, 레이아웃, 인터랙션 패턴 등을 실질적으로
                모방하여 <Strong>동일·유사한 서비스를 제작</Strong>하거나{" "}
                <Strong>2차적 저작물을 작성</Strong>하는 행위
              </li>
              <li>
                AI 판결 결과물을 체계적으로 수집하여{" "}
                <Strong>상업적 목적으로 이용</Strong>하거나 제3자에게 판매·제공하는
                행위
              </li>
              <li>
                서비스의 기술적 보호 조치를 우회·해제·무력화하거나, 소스 코드를{" "}
                <Strong>역컴파일(Decompile)·역어셈블(Disassemble)·리버스 엔지니어링(Reverse Engineering)</Strong>
                하는 행위
              </li>
              <li>
                권리자의 상표·서비스표·로고를 무단으로 사용하여 이용자에게 혼동을
                야기하는 행위
              </li>
            </ol>
          </Section>

          {/* ── 제3조 ── */}
          <Section title="제3조 (데이터 크롤링 및 스크래핑의 전면 금지)">
            <div
              className="mb-4 rounded border px-4 py-3 text-xs leading-relaxed"
              style={{
                borderColor: "rgba(239,68,68,0.3)",
                backgroundColor: "rgba(239,68,68,0.05)",
                color: "#fca5a5",
              }}
            >
              <strong>경고:</strong> 본 서비스에 대한 자동화된 데이터 수집 행위는
              관련 법령에 의하여 형사 처벌 및 민사상 손해배상 청구의 대상이 될 수
              있습니다.
            </div>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                자동화된 봇(Bot), 스파이더(Spider), 크롤러(Crawler),
                스크래퍼(Scraper), 매크로(Macro) 또는 이와 유사한 수단을 이용하여
                본 서비스의 웹페이지, API 엔드포인트, 데이터베이스에 접근하거나
                데이터를 수집·추출·저장하는 행위를{" "}
                <Strong>전면적으로 금지</Strong>합니다.
              </li>
              <li>
                특히 다음 각 목의 행위는 엄격히 금지됩니다:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    AI 판결 결과물, 판결문, 투표 데이터 등을 자동화된 방법으로
                    수집하여{" "}
                    <Strong>
                      제3자의 AI 모델 학습(Machine Learning Training)에
                      활용
                    </Strong>
                    하는 행위
                  </li>
                  <li>
                    서비스의 데이터를 체계적으로 수집하여 별도의 데이터베이스를
                    구축하는 행위
                  </li>
                  <li>
                    API 엔드포인트에 비정상적인 대량 요청을 전송하여 서비스의
                    안정성을 저해하는 행위
                  </li>
                  <li>
                    프롬프트 인젝션(Prompt Injection) 등의 기법을 이용하여 AI
                    시스템의 내부 프롬프트를 추출·탈취하려는 행위
                  </li>
                </ul>
              </li>
              <li>
                본 서비스의 <code className="text-red-300">robots.txt</code>에
                명시된 크롤링 제한 규칙을 위반하는 행위는 본 조항의 위반으로
                간주됩니다.
              </li>
              <li>
                검색엔진의 정상적인 인덱싱 목적의 크롤링은 허용되나, 이 경우에도{" "}
                <code className="text-red-300">robots.txt</code> 규칙을 반드시
                준수하여야 합니다.
              </li>
            </ol>
          </Section>

          {/* ── 제4조 ── */}
          <Section title="제4조 (기술적 보호 조치)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                권리자는 본 약관의 실효성 확보를 위해 다음과 같은 기술적 보호
                조치를 시행할 수 있습니다:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    API 요청 속도 제한(Rate Limiting) 및 비정상 트래픽 차단
                  </li>
                  <li>
                    User-Agent, IP 주소 기반의 자동화 접근 탐지 및 차단
                  </li>
                  <li>CAPTCHA 등 사람 인증(Human Verification) 시스템 적용</li>
                  <li>접근 로그 모니터링 및 이상 행위 분석</li>
                </ul>
              </li>
              <li>
                위 기술적 보호 조치를 우회·무력화·회피하는 행위는{" "}
                <Strong>저작권법 제104조의2(기술적 보호조치의 무력화 금지)</Strong>
                에 따라 처벌의 대상이 됩니다.
              </li>
            </ol>
          </Section>

          {/* ── 제5조 ── */}
          <Section title="제5조 (이용자의 의무)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                이용자는 본 서비스를 개인적·비상업적 목적으로만 이용하여야 하며,
                서비스 화면에 표시되는 콘텐츠를 정상적으로 열람하는 범위 내에서만
                이용할 수 있습니다.
              </li>
              <li>
                이용자는 서비스 이용 과정에서 취득한 정보를 권리자의 사전 서면
                동의 없이 상업적 목적으로 활용하거나 제3자에게 제공하여서는 안
                됩니다.
              </li>
              <li>
                이용자는 본 서비스의 보안 취약점을 발견한 경우 이를 악용하지 않고
                권리자에게 즉시 신고하여야 합니다.
              </li>
            </ol>
          </Section>

          {/* ── 제6조 ── */}
          <Section title="제6조 (위반 시 법적 조치)">
            <div
              className="mb-4 rounded border px-4 py-3 text-xs leading-relaxed"
              style={{
                borderColor: "rgba(239,68,68,0.4)",
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#fca5a5",
              }}
            >
              <strong>법적 경고:</strong> 본 약관을 위반하는 행위에 대하여
              권리자는 아래와 같이 가용한 모든 법적 수단을 동원하여 단호히
              대응합니다.
            </div>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <Strong>민사상 조치:</Strong> 권리자는 위반자에 대하여{" "}
                <Strong>저작권법</Strong>, <Strong>부정경쟁방지법</Strong>,{" "}
                <Strong>정보통신망법</Strong> 등 관련 법령에 따라
                침해금지청구(가처분 포함), 손해배상청구, 부당이득반환청구를 제기할
                수 있습니다. 이 경우 실손해액 또는 법정손해배상액 중 큰 금액을
                청구하며, 변호사 비용 등 소송 비용 일체를 위반자에게 청구합니다.
              </li>
              <li>
                <Strong>형사상 조치:</Strong> 저작권 침해(저작권법 제136조, 5년
                이하 징역 또는 5천만 원 이하 벌금), 영업비밀 침해(부정경쟁방지법
                제18조, 10년 이하 징역 또는 5억 원 이하 벌금),
                컴퓨터등장애업무방해(형법 제314조 제2항) 등 관련 형사 고소·고발을
                진행합니다.
              </li>
              <li>
                <Strong>즉시 접근 차단:</Strong> 위반 행위가 감지될 경우 해당
                이용자의 서비스 이용을 즉시 제한하고, IP 주소 차단 등 기술적
                조치를 취합니다.
              </li>
              <li>
                <Strong>증거 보전:</Strong> 권리자는 위반 행위에 대한 서버 로그,
                접근 기록, 트래픽 데이터 등을 법적 분쟁에 대비하여 보전합니다.
              </li>
            </ol>
          </Section>

          {/* ── 제7조 ── */}
          <Section title="제7조 (준거법 및 관할)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                본 약관의 해석 및 적용에 관하여는{" "}
                <Strong>대한민국 법률</Strong>을 준거법으로 합니다.
              </li>
              <li>
                본 약관과 관련하여 분쟁이 발생한 경우, 권리자의 소재지를 관할하는{" "}
                <Strong>대한민국 법원</Strong>을 전속적 합의 관할 법원으로 합니다.
              </li>
              <li>
                해외에서 발생한 침해 행위에 대해서도 대한민국 법원의 관할이
                적용되며, 필요 시 국제 공조를 통해 법적 조치를 진행합니다.
              </li>
            </ol>
          </Section>

          {/* ── 제8조 ── */}
          <Section title="제8조 (약관의 변경)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                권리자는 관련 법령의 변경 또는 서비스 운영상 필요에 따라 본 약관을
                변경할 수 있으며, 변경 시 최소 7일 전 서비스 내 공지합니다.
              </li>
              <li>
                변경된 약관은 공지된 시행일부터 효력이 발생하며, 시행일 이후
                서비스를 계속 이용하는 것은 변경된 약관에 동의한 것으로
                간주됩니다.
              </li>
            </ol>
          </Section>

          {/* ── 부칙 ── */}
          <Section title="부칙">
            <p>본 약관은 2026년 3월 10일부터 시행합니다.</p>
          </Section>

          {/* ── 저작권 표시 ── */}
          <div
            className="mt-6 rounded border px-4 py-4 text-center text-xs leading-relaxed"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: "#9ca3af",
            }}
          >
            <p className="mb-1" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              &copy; 2026 네온즈(Neons). All Rights Reserved.
            </p>
            <p>
              본 서비스의 모든 콘텐츠, 소스 코드, UI/UX 디자인, AI 시스템 로직은
              대한민국 저작권법 및 국제 저작권 조약에 의해 보호됩니다.
            </p>
            <p>
              Unauthorized reproduction, distribution, crawling, or scraping is
              strictly prohibited and subject to legal action.
            </p>
          </div>
        </article>

        <div className="mt-12 flex gap-4 border-t border-white/10 pt-6 text-xs text-zinc-600">
          <Link href="/terms" className="transition hover:text-red-300">
            이용약관 보기 &rarr;
          </Link>
          <Link href="/privacy" className="transition hover:text-red-300">
            개인정보처리방침 보기 &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-zinc-100">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-zinc-100">{children}</strong>
}
