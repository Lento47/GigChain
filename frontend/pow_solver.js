/**
 * Client-Side Proof-of-Work Solver
 * 
 * Solves PoW challenges required by W-CSAP v3.0 for DDoS protection.
 * Uses Web Crypto API for efficient SHA-256 hashing.
 */

/**
 * Count leading zero bits in a hex hash string
 * @param {string} hexHash - Hex string hash
 * @returns {number} Number of leading zero bits
 */
function countLeadingZeroBits(hexHash) {
    let leadingZeros = 0;
    
    for (let char of hexHash) {
        // Convert hex char to 4-bit binary
        const bits = parseInt(char, 16).toString(2).padStart(4, '0');
        
        // Count zeros until we hit a 1
        for (let bit of bits) {
            if (bit === '0') {
                leadingZeros++;
            } else {
                return leadingZeros;
            }
        }
    }
    
    return leadingZeros;
}

/**
 * Compute SHA-256 hash of a string
 * @param {string} message - String to hash
 * @returns {Promise<string>} Hex hash string
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Solve a Proof-of-Work challenge
 * 
 * @param {string} challenge - PoW challenge from server
 * @param {number} difficulty - Number of leading zero bits required
 * @param {Function} onProgress - Optional callback for progress updates (nonce, attempts)
 * @returns {Promise<string>} Nonce that solves the challenge
 */
export async function solvePoW(challenge, difficulty, onProgress = null) {
    console.log(`🎯 Starting PoW solver (difficulty: ${difficulty})`);
    console.log(`   Expected attempts: ~${Math.pow(2, difficulty)}`);
    
    let nonce = 0;
    const startTime = performance.now();
    
    while (true) {
        const solution = challenge + nonce.toString();
        const hash = await sha256(solution);
        
        const leadingZeros = countLeadingZeroBits(hash);
        
        if (leadingZeros >= difficulty) {
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ PoW solved!`);
            console.log(`   Nonce: ${nonce}`);
            console.log(`   Attempts: ${nonce + 1}`);
            console.log(`   Time: ${elapsed}s`);
            console.log(`   Hash: ${hash}`);
            console.log(`   Leading zeros: ${leadingZeros}`);
            
            return nonce.toString();
        }
        
        nonce++;
        
        // Progress callback every 100 attempts
        if (onProgress && nonce % 100 === 0) {
            onProgress(nonce, nonce + 1);
        }
        
        // Update UI every 1000 attempts
        if (nonce % 1000 === 0) {
            console.log(`   Solving... (${nonce} attempts)`);
            
            // Yield to event loop to prevent freezing UI
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}

/**
 * Request authentication challenge with PoW
 * 
 * Complete flow:
 * 1. Get PoW challenge from server
 * 2. Solve PoW locally
 * 3. Request auth challenge with PoW solution
 * 
 * @param {string} walletAddress - Wallet address
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Auth challenge response
 */
export async function requestChallengeWithPoW(walletAddress, onProgress = null) {
    try {
        // Step 1: Get PoW challenge
        console.log('📝 Step 1: Requesting PoW challenge...');
        
        const powResponse = await fetch('/api/auth/pow-challenge', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!powResponse.ok) {
            throw new Error(`PoW challenge request failed: ${powResponse.statusText}`);
        }
        
        const { pow_challenge, difficulty } = await powResponse.json();
        
        console.log(`   PoW challenge: ${pow_challenge}`);
        console.log(`   Difficulty: ${difficulty}`);
        
        // Step 2: Solve PoW
        console.log('⚙️ Step 2: Solving PoW...');
        
        const nonce = await solvePoW(pow_challenge, difficulty, onProgress);
        
        // Step 3: Get auth challenge with PoW solution
        console.log('📝 Step 3: Requesting auth challenge with PoW solution...');
        
        const challengeResponse = await fetch('/api/auth/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                pow_challenge: pow_challenge,
                pow_nonce: nonce,
                pow_difficulty: difficulty
            })
        });
        
        if (!challengeResponse.ok) {
            const error = await challengeResponse.json();
            throw new Error(error.detail || 'Challenge request failed');
        }
        
        const challengeData = await challengeResponse.json();
        
        console.log('✅ Auth challenge received!');
        
        return challengeData;
        
    } catch (error) {
        console.error('❌ PoW challenge flow failed:', error);
        throw error;
    }
}

/**
 * PoW Solver with UI updates (React/Vue example)
 * 
 * @param {string} challenge - PoW challenge
 * @param {number} difficulty - Difficulty
 * @param {Function} setProgress - State setter for progress
 * @returns {Promise<string>} Nonce
 */
export async function solvePoWWithUI(challenge, difficulty, setProgress) {
    return await solvePoW(challenge, difficulty, (nonce, attempts) => {
        // Update UI with progress
        setProgress({
            attempts: attempts,
            expectedAttempts: Math.pow(2, difficulty),
            percentage: Math.min((attempts / Math.pow(2, difficulty)) * 100, 100)
        });
    });
}

// Example usage in React component:
/*
function AuthComponent() {
    const [powProgress, setPowProgress] = useState(null);
    const [challenge, setChallenge] = useState(null);
    
    async function handleAuth() {
        try {
            // Request challenge with PoW
            const challengeData = await requestChallengeWithPoW(
                walletAddress,
                (nonce, attempts) => {
                    setPowProgress({
                        attempts,
                        percentage: (attempts / Math.pow(2, 4)) * 100
                    });
                }
            );
            
            setChallenge(challengeData);
            setPowProgress(null);
            
            // Continue with signature...
            
        } catch (error) {
            console.error(error);
        }
    }
    
    return (
        <div>
            {powProgress && (
                <div>
                    Solving security challenge... 
                    {powProgress.attempts} attempts
                    ({powProgress.percentage.toFixed(1)}%)
                </div>
            )}
            <button onClick={handleAuth}>Authenticate</button>
        </div>
    );
}
*/
