import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { Coins, TrendingUp, Lock, Unlock, Clock, Award } from 'lucide-react';
import WalletBanner from '../../components/Web3/WalletBanner';
import './Staking.css';
import '../../styles/web3-theme.css';

const StakingSimple = () => {
  const { address } = useWallet();
  const { sessionData } = useWalletAuth();
  const [userBalance, setUserBalance] = useState(1000);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [stakeInput, setStakeInput] = useState('');
  const [unstakeInput, setUnstakeInput] = useState('');
  const [selectedPool, setSelectedPool] = useState(null);

  const stakingPools = [
    {
      id: 1,
      name: 'Pool Flexible',
      apy: 8.5,
      lockPeriod: 0,
      minStake: 10,
      totalStaked: 125000,
      participants: 347,
      description: 'Sin período de bloqueo, retira cuando quieras',
      icon: '🔓'
    },
    {
      id: 2,
      name: 'Pool 30 Días',
      apy: 12.5,
      lockPeriod: 30,
      minStake: 50,
      totalStaked: 85000,
      participants: 189,
      description: 'Bloqueo de 30 días para mejores recompensas',
      icon: '⏰'
    },
    {
      id: 3,
      name: 'Pool 90 Días',
      apy: 18.0,
      lockPeriod: 90,
      minStake: 100,
      totalStaked: 210000,
      participants: 256,
      description: 'Máximas recompensas con compromiso de 90 días',
      icon: '🏆'
    },
    {
      id: 4,
      name: 'Pool Premium',
      apy: 25.0,
      lockPeriod: 180,
      minStake: 500,
      totalStaked: 450000,
      participants: 124,
      description: 'Para inversores serios, 180 días de bloqueo',
      icon: '💎'
    }
  ];

  const [activeStakes, setActiveStakes] = useState([
    {
      id: 1,
      pool: 'Pool Flexible',
      amount: 250,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      earned: 2.85,
      apy: 8.5
    }
  ]);

  const handleStake = () => {
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0 || amount > userBalance) {
      alert('Cantidad inválida o saldo insuficiente');
      return;
    }

    if (!selectedPool) {
      alert('Selecciona un pool de staking');
      return;
    }

    if (amount < selectedPool.minStake) {
      alert(`El mínimo para este pool es ${selectedPool.minStake} GIG`);
      return;
    }

    const newStake = {
      id: Date.now(),
      pool: selectedPool.name,
      amount: amount,
      startDate: new Date(),
      earned: 0,
      apy: selectedPool.apy
    };

    setActiveStakes([...activeStakes, newStake]);
    setUserBalance(userBalance - amount);
    setStakedAmount(stakedAmount + amount);
    setStakeInput('');
    alert(`¡${amount} GIG stakeados exitosamente!`);
  };

  const handleUnstake = (stakeId) => {
    const stake = activeStakes.find(s => s.id === stakeId);
    if (!stake) return;

    const totalReturn = stake.amount + stake.earned;
    setUserBalance(userBalance + totalReturn);
    setStakedAmount(stakedAmount - stake.amount);
    setActiveStakes(activeStakes.filter(s => s.id !== stakeId));
    alert(`${totalReturn.toFixed(2)} GIG desbloqueados (${stake.earned.toFixed(2)} GIG de recompensas)`);
  };

  const calculateDaysStaked = (startDate) => {
    const now = new Date();
    const diff = now - startDate;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <div className="staking-container">
      {/* Wallet Connection Banner */}
      <WalletBanner />
      
      <div className="staking-header">
        <h1 className="gradient-text">💰 Staking GIG</h1>
        <p className="staking-subtitle">Gana recompensas por mantener tus tokens bloqueados</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Balance Disponible</p>
            <h3>{formatNumber(userBalance)} GIG</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon locked">
            <Lock size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Stakeado</p>
            <h3>{formatNumber(stakedAmount)} GIG</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon earnings">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Ganancias Totales</p>
            <h3>{activeStakes.reduce((sum, s) => sum + s.earned, 0).toFixed(2)} GIG</h3>
          </div>
        </div>
      </div>

      {/* Staking Pools */}
      <div className="staking-section">
        <h2>Pools de Staking Disponibles</h2>
        <div className="pools-grid">
          {stakingPools.map(pool => (
            <div 
              key={pool.id} 
              className={`pool-card ${selectedPool?.id === pool.id ? 'selected' : ''}`}
              onClick={() => setSelectedPool(pool)}
            >
              <div className="pool-header">
                <span className="pool-icon">{pool.icon}</span>
                <h3>{pool.name}</h3>
              </div>

              <div className="pool-apy">
                <span className="apy-value">{pool.apy}%</span>
                <span className="apy-label">APY</span>
              </div>

              <p className="pool-description">{pool.description}</p>

              <div className="pool-details">
                <div className="detail-row">
                  <Clock size={16} />
                  <span>{pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod} días`}</span>
                </div>
                <div className="detail-row">
                  <Coins size={16} />
                  <span>Mín: {pool.minStake} GIG</span>
                </div>
                <div className="detail-row">
                  <Award size={16} />
                  <span>{formatNumber(pool.totalStaked)} GIG</span>
                </div>
              </div>

              <div className="pool-participants">
                {pool.participants} participantes
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stake Form */}
      <div className="stake-form-section">
        <div className="stake-form-card">
          <h3>💎 Stakear Tokens</h3>
          <div className="form-group">
            <label>Cantidad a stakear</label>
            <div className="input-with-max">
              <input
                type="number"
                placeholder="0.00"
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
              />
              <button 
                className="max-btn"
                onClick={() => setStakeInput(userBalance.toString())}
              >
                MAX
              </button>
            </div>
            <p className="input-hint">Disponible: {formatNumber(userBalance)} GIG</p>
          </div>
          {selectedPool && (
            <div className="selected-pool-info">
              <p>Pool seleccionado: <strong>{selectedPool.name}</strong></p>
              <p>APY: <strong>{selectedPool.apy}%</strong></p>
              <p>Período: <strong>{selectedPool.lockPeriod === 0 ? 'Flexible' : `${selectedPool.lockPeriod} días`}</strong></p>
            </div>
          )}
          <button 
            className="stake-btn"
            onClick={handleStake}
            disabled={!selectedPool || !stakeInput || parseFloat(stakeInput) <= 0}
          >
            <Lock size={18} />
            Stakear Ahora
          </button>
        </div>
      </div>

      {/* Active Stakes */}
      {activeStakes.length > 0 && (
        <div className="active-stakes-section">
          <h2>Mis Stakes Activos</h2>
          <div className="stakes-list">
            {activeStakes.map(stake => (
              <div key={stake.id} className="stake-item">
                <div className="stake-info">
                  <h4>{stake.pool}</h4>
                  <div className="stake-details">
                    <span className="stake-amount">{formatNumber(stake.amount)} GIG</span>
                    <span className="stake-days">{calculateDaysStaked(stake.startDate)} días</span>
                    <span className="stake-apy">{stake.apy}% APY</span>
                  </div>
                  <div className="stake-earnings">
                    <TrendingUp size={16} />
                    <span>Ganado: <strong>{stake.earned.toFixed(4)} GIG</strong></span>
                  </div>
                </div>
                <button 
                  className="unstake-btn"
                  onClick={() => handleUnstake(stake.id)}
                >
                  <Unlock size={18} />
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingSimple;

